import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { preloadLandingSounds, schedulePlayback } from "../landing/landing_player";
import CustomModal from "../../components/CustomModal";
import useCustomModal from "../../components/useCustomModal";
import "./mobile_post_modal.css";
import RecordingPlaybackModal from "../account/recording_playback_modal.js";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

function parseDbTimestamp(s) {
    if (!s) return null;
    const iso = s.replace(" ", "T");
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

function timeAgoTS(ts) {
    const d = typeof ts === "string" ? parseDbTimestamp(ts) : ts instanceof Date ? ts : null;
    if (!d) return "";
    const now = Date.now();
    const diffMs = Math.max(0, now - d.getTime());
    const sec = Math.floor(diffMs / 1000);
    const min = Math.floor(sec / 60);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    if (sec < 45) return "just now";
    if (min < 60) return `${min}m`;
    if (hr < 24) return `${hr}h`;
    if (day === 1) return "yesterday";
    if (day < 7) return `${day}d`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatCreated(ts) {
    const t = timeAgoTS(ts);
    if (!t) return "";
    const noAgo = t === "just now" || t === "yesterday";
    return `Created ${t}${noAgo ? "" : " ago"}`;
}

function buildTree(rows) {
    const byId = new Map();
    rows.forEach(r => byId.set(r.id, { ...r, children: [] }));
    const roots = [];
    rows.forEach(r => {
        if (r.parentId) {
            const p = byId.get(r.parentId);
            if (p) p.children.push(byId.get(r.id));
        } else {
            roots.push(byId.get(r.id));
        }
    });
    const sortFn = (a, b) => {
        const la = a.likeCount ?? 0, lb = b.likeCount ?? 0;
        if (lb !== la) return lb - la;
        const da = parseDbTimestamp(a.created_at)?.getTime() ?? 0;
        const db = parseDbTimestamp(b.created_at)?.getTime() ?? 0;
        return da - db;
    };
    const sortTree = nodes => {
        nodes.sort(sortFn);
        nodes.forEach(n => n.children && sortTree(n.children));
    };
    sortTree(roots);
    return roots;
}

function CommentNode({
    node,
    depth,
    currentUser,
    onReply,
    onLike,
    collapsedSet,
    toggleCollapsed
}) {
    const isCollapsed = collapsedSet.has(node.id);
    return (
        <div className="m-comment" style={{ marginLeft: depth * 14 }}>
            <div className="m-comment-rail" />
            <div className="m-comment-card">
                <div className="m-comment-header">
                    <button
                        className="m-collapse-btn"
                        onClick={() => toggleCollapsed(node.id)}
                        aria-label={isCollapsed ? "Expand thread" : "Collapse thread"}
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? "▶" : "▼"}
                    </button>
                    <span className="m-comment-author">{node.author}</span>
                    <span className="m-comment-dot">•</span>
                    <span className="m-comment-time">{timeAgoTS(node.created_at)}</span>
                </div>

                {!isCollapsed && (
                    <>
                        <div className="m-comment-body">{node.content}</div>
                        <div className="m-comment-actions">
                            <button
                                className={`m-like-btn ${node.liked ? "liked" : ""}`}
                                onClick={() => onLike(node)}
                                aria-label={node.liked ? "Unlike comment" : "Like comment"}
                            >
                                {node.liked ? "❤️" : "🤍"} {node.likeCount ?? 0}
                            </button>
                            <button
                                className="m-reply-btn"
                                onClick={() => onReply(node)}
                                disabled={!currentUser}
                                title={!currentUser ? "Login to reply" : "Reply"}
                            >
                                Reply
                            </button>
                        </div>

                        {node.children?.length > 0 && (
                            <div className="m-comment-children">
                                {node.children.map(child => (
                                    <CommentNode
                                        key={child.id}
                                        node={child}
                                        depth={depth + 1}
                                        currentUser={currentUser}
                                        onReply={onReply}
                                        onLike={onLike}
                                        collapsedSet={collapsedSet}
                                        toggleCollapsed={toggleCollapsed}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function MobilePostModal({ post, user, onClose, onBumpPostComments }) {
    const [commentsFlat, setCommentsFlat] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyTo, setReplyTo] = useState(null);
    const [draft, setDraft] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [collapsed, setCollapsed] = useState(() => new Set());
    const listRef = useRef(null);
    const firstLoadRef = useRef(true);
    const [postError, setPostError] = useState("");
    const { modalState, showModal, closeModal } = useCustomModal();

    // ==== Attached recording (mini player) ====
    const [buffers, setBuffers] = useState(null);
    const [recLoading, setRecLoading] = useState(false);
    const [recErr, setRecErr] = useState("");
    const [recMeta, setRecMeta] = useState(null);
    const [recNotes, setRecNotes] = useState([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const stopRef = useRef(null);
    const [showRecModal, setShowRecModal] = useState(false);

    const tree = useMemo(() => buildTree(commentsFlat), [commentsFlat]);

    const toggleCollapsed = useCallback((id) => {
        setCollapsed(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const b = await preloadLandingSounds();
                if (mounted) setBuffers(b);
            } catch (e) {
                console.error("preloadLandingSounds failed:", e);
            }
        })();
        return () => { mounted = false; };
    }, []);

    const fetchRecordingById = useCallback(async (id) => {
        if (id == null || Number.isNaN(id)) return;
        try {
            setRecLoading(true);
            setRecErr("");
            const res = await fetch(
                `${PHP_URL}/getLocalRecordingById.php?id=${encodeURIComponent(id)}`,
                { credentials: "include", cache: "no-store" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();

            if (!data?.success || !data?.recording) throw new Error("Bad recording payload");

            setRecMeta({
                id: data.id,
                title: data.title ?? `Recording #${data.id}`,
                description: data.description ?? ""
            });
            setRecNotes(data.recording);
        } catch (e) {
            console.error("fetchRecordingById failed:", e);
            setRecMeta(null);
            setRecNotes([]);
            setRecErr("Failed to load attached recording.");
        } finally {
            setRecLoading(false);
        }
    }, []);

    useEffect(() => {
        if (post?.recording_id != null && !Number.isNaN(post.recording_id)) {
            fetchRecordingById(post.recording_id);
        } else {
            setRecMeta(null);
            setRecNotes([]);
            setRecErr("");
        }
    }, [post?.recording_id, fetchRecordingById]);

    const stopAll = useCallback(() => {
        if (stopRef.current) {
            try { stopRef.current(); } catch { }
            stopRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const onPlay = useCallback(() => {
        if (!buffers || !recNotes || (Array.isArray(recNotes) && recNotes.length === 0)) return;
        stopAll();
        stopRef.current = schedulePlayback(buffers, recNotes, () => {
            setIsPlaying(false);
            stopRef.current = null;
        });
        setIsPlaying(true);
    }, [buffers, recNotes, stopAll]);

    useEffect(() => {
        return () => stopAll();
    }, [stopAll]);

    const fetchComments = useCallback(async () => {
        if (firstLoadRef.current) setLoading(true);
        const prevY = listRef.current ? listRef.current.scrollTop : 0;
        try {
            const res = await fetch(
                `${PHP_URL}/getForumComments.php?postId=${encodeURIComponent(post.id)}`,
                { credentials: "include", cache: "no-store" }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rows = await res.json();

            setCommentsFlat(prev => {
                const prevKey = prev.map(c => `${c.id}:${c.likeCount}`).join("|");
                const nextFlat = rows.map(r => ({
                    id: Number(r.id),
                    postId: Number(r.postId),
                    parentId: r.parentId ? Number(r.parentId) : null,
                    author: r.author || "",
                    authorId: Number(r.authorId ?? 0),
                    content: r.content || "",
                    likesFrom: Array.isArray(r.likesFrom) ? r.likesFrom : [],
                    likeCount: Number(r.likeCount ?? 0),
                    created_at: r.created_at || null,
                    liked: user ? (Array.isArray(r.likesFrom) && r.likesFrom.includes(user.username)) : false,
                }));
                const nextKey = nextFlat.map(c => `${c.id}:${c.likeCount}`).join("|");
                return prevKey === nextKey ? prev : nextFlat;
            });

            if (firstLoadRef.current) {
                const topLevel = rows.filter(r => !r.parentId);
                if (topLevel.length >= 5) {
                    setCollapsed(new Set([Number(topLevel[4].id)]));
                } else {
                    setCollapsed(new Set());
                }
            }
        } catch (e) {
            console.error("Failed to fetch comments:", e);
            setCommentsFlat([]);
        } finally {
            if (firstLoadRef.current) {
                setLoading(false);
                firstLoadRef.current = false;
            }
            requestAnimationFrame(() => {
                if (listRef.current) listRef.current.scrollTop = prevY;
            });
        }
    }, [post.id, user?.username]);

    useEffect(() => {
        document.body.classList.add("popup-open");
        fetchComments();
        return () => document.body.classList.remove("popup-open");
    }, [fetchComments]);

    useEffect(() => {
        if (!post?.id) return;
        const url = `${PHP_URL}/commentsStream.php?postId=${encodeURIComponent(post.id)}`;
        const es = new EventSource(url, { withCredentials: false });

        const onComments = () => fetchComments();
        const onErr = (e) => console.warn("[SSE] comments error", e);

        es.addEventListener("comments", onComments);
        es.onmessage = onComments;
        es.onerror = onErr;

        return () => es.close();
    }, [post?.id, fetchComments]);

    const onReply = (node) => setReplyTo(node);

    const onLike = async (node) => {
        if (!user) return;
        setCommentsFlat(prev => prev.map(c => {
            if (c.id !== node.id) return c;
            const goingToLike = !c.liked;
            const nextLikesFrom = goingToLike
                ? Array.from(new Set([...(c.likesFrom || []), user.username]))
                : (c.likesFrom || []).filter(u => u !== user.username);
            return { ...c, liked: goingToLike, likesFrom: nextLikesFrom, likeCount: nextLikesFrom.length };
        }));
        try {
            const res = await fetch(`${PHP_URL}/likeForumComment.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ commentId: node.id }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);
            setCommentsFlat(prev => prev.map(c => c.id === node.id
                ? { ...c, liked: data.liked, likeCount: data.likeCount, likesFrom: data.likesFrom }
                : c
            ));
        } catch (err) {
            console.error("like comment failed:", err);
            fetchComments();
            showModal("Failed to like/unlike. Please try again.", "error");
        }
    };

    const submitComment = async (e) => {
        e?.preventDefault?.();
        setPostError("");
        if (!user || !draft.trim()) return;
        setSubmitting(true);

        const tempId = Date.now();
        const optimistic = {
            id: tempId,
            postId: post.id,
            parentId: replyTo?.id ?? null,
            author: user.username,
            authorId: user.id,
            content: draft.trim(),
            likesFrom: [user.username],
            likeCount: 1,
            created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
            liked: true,
        };
        setCommentsFlat(prev => [...prev, optimistic]);
        setDraft("");

        try {
            const res = await fetch(`${PHP_URL}/makeForumComment.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    postId: post.id,
                    parentId: replyTo?.id ?? null,
                    content: optimistic.content,
                    author: user.username,
                    authorId: user.id
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
            await fetchComments();
            onBumpPostComments?.(post.id);
            setReplyTo(null);
        } catch (err) {
            console.error("comment failed:", err);
            setCommentsFlat(prev => prev.filter(c => c.id !== tempId));
            setPostError(
                err?.message?.trim() || "Failed to post comment."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!post) return null;

    return (
        <>
            <div className="m-post-overlay" onMouseDown={onClose}>
                <div className="m-post-modal" onMouseDown={(e) => e.stopPropagation()}>
                    <div className="m-post-header">
                        <button className="m-close-btn" onClick={onClose} aria-label="Close">✕</button>
                        <h2 className="m-post-title">{post.title}</h2>
                    </div>

                    <div className="m-post-body">
                        <div className="m-post-block">
                            <div className="m-post-meta">
                                <span className="m-post-author">by {post.author}</span>
                                {!!post.created_at && (
                                    <>
                                        <span className="m-dot">•</span>
                                        <span className="m-post-time">{formatCreated(post.created_at)}</span>
                                    </>
                                )}
                            </div>
                            <div className="m-post-content">{post.content}</div>
                            <div className="m-post-tags">
                                {post.tags?.map(t => <span key={t} className="mobile-post-tag">{t}</span>)}
                            </div>
                            <div className="m-post-stats">
                                <span>{post.likes ?? 0} likes</span>
                                <span>{post.comments ?? 0} comments</span>
                            </div>
                            <div className="m-attached-recording">
                                {recLoading && <div className="m-loading">Loading recording…</div>}
                                {!recLoading && recErr && (
                                    <div className="m-error" role="alert">{recErr}</div>
                                )}
                                {!recLoading && !recErr && recMeta && Array.isArray(recNotes) && recNotes.length > 0 && (
                                    <div className="m-mini-player">
                                        <div className="m-mini-player-meta">
                                            <strong>{recMeta.title}</strong>
                                            {recMeta.description ? <span className="m-mini-desc"> — {recMeta.description}</span> : null}
                                        </div>
                                        <div className="m-mini-player-controls">
                                            <button
                                                type="button"
                                                className="m-mini-play"
                                                onClick={() => setShowRecModal(true)}
                                            >
                                                ▶ Play
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <form className="m-new-comment" onSubmit={submitComment}>
                            {postError && (
                                <div className="ab-error" role="alert" aria-live="assertive">
                                    {postError}
                                </div>
                            )}

                            <textarea
                                placeholder={user ? "Write a comment…" : "Login to comment"}
                                value={draft}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    if (v.length <= 500) setDraft(v);
                                    if (postError) setPostError("");
                                }}
                                disabled={!user || submitting}
                                rows={replyTo ? 3 : 4}
                            />

                            <div className="ab-new-comment-meta">
                                <span className={`char-count ${draft.length >= 500 ? "limit-reached" : ""}`}>
                                    {draft.length}/500
                                </span>
                            </div>
                            <div className="m-new-comment-actions">
                                {replyTo && (
                                    <div className="m-replying-to">
                                        Replying to <b>{replyTo.author}</b>
                                        <button type="button" className="m-cancel-reply" onClick={() => setReplyTo(null)}>Cancel</button>
                                    </div>
                                )}
                                <button
                                    className="mobile-submit-btn"
                                    type="submit"
                                    disabled={!user || submitting || !draft.trim()}
                                >
                                    {submitting ? "Posting…" : "Post"}
                                </button>
                            </div>
                        </form>

                        <div className="m-comments-list" ref={listRef}>
                            {loading ? (
                                <div className="m-loading">Loading comments…</div>
                            ) : tree.length === 0 ? (
                                <div className="m-empty">Be the first to comment!</div>
                            ) : (
                                tree.map(node => (
                                    <CommentNode
                                        key={node.id}
                                        node={node}
                                        depth={0}
                                        currentUser={user}
                                        onReply={onReply}
                                        onLike={onLike}
                                        collapsedSet={collapsed}
                                        toggleCollapsed={toggleCollapsed}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <CustomModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                message={modalState.message}
                type={modalState.type}
                title={modalState.title}
            />

            {showRecModal && recMeta && (
                <RecordingPlaybackModal
                    recording={{
                        id: recMeta.id,
                        title: recMeta.title,
                        description: recMeta.description,
                    }}
                    recordedNotes={recNotes}
                    onClose={() => setShowRecModal(false)}
                />
            )}
        </>
    );
}