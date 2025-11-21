import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { preloadLandingSounds, schedulePlayback } from "../landing/landing_player";
import CustomModal from "../../components/CustomModal";
import useCustomModal from "../../components/useCustomModal";
import "./desktop_post_modal.css";

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
    const diffMs = Math.max(0, Date.now() - d.getTime());
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
        const la = (a.likeCount ?? 0), lb = (b.likeCount ?? 0);
        if (lb !== la) return lb - la;
        const da = parseDbTimestamp(a.created_at)?.getTime() ?? 0;
        const db = parseDbTimestamp(b.created_at)?.getTime() ?? 0;
        return da - db;
    };
    const sortTree = (nodes) => {
        nodes.sort(sortFn);
        nodes.forEach(n => n.children && sortTree(n.children));
    };
    sortTree(roots);
    return roots;
}

function CommentNode({
    node,
    depth,
    onReply,
    onLike,
    currentUser,
    collapsedSet,
    toggleCollapsed
}) {
    const isCollapsed = collapsedSet.has(node.id);

    return (
        <div className="ab-comment" style={{ marginLeft: depth * 16 }}>
            <div className="ab-comment-rail" />
            <div className="ab-comment-card">
                <div className="ab-comment-header">
                    <button
                        className="ab-collapse-btn"
                        onClick={() => toggleCollapsed(node.id)}
                        aria-label={isCollapsed ? "Expand thread" : "Collapse thread"}
                        title={isCollapsed ? "Expand" : "Collapse"}
                    >
                        {isCollapsed ? "▶" : "▼"}
                    </button>
                    <span className="ab-comment-author"> {node.author} </span>
                    <span className="ab-comment-dot">•</span>
                    <span className="ab-comment-time">{timeAgoTS(node.created_at)}</span>
                </div>

                {!isCollapsed && (
                    <>
                        <div className="ab-comment-body">{node.content}</div>
                        <div className="ab-comment-actions">
                            <button
                                className={`ab-like-btn ${node.liked ? "liked" : ""}`}
                                onClick={() => onLike(node)}
                                aria-label={node.liked ? "Unlike comment" : "Like comment"}
                            >
                                {node.liked ? "❤️" : "🤍"} {node.likeCount ?? 0}
                            </button>
                            <button
                                className="ab-reply-btn"
                                onClick={() => onReply(node)}
                                disabled={!currentUser}
                                title={!currentUser ? "Login to reply" : "Reply"}
                            >
                                Reply
                            </button>
                        </div>

                        {node.children?.length > 0 && (
                            <div className="ab-comment-children">
                                {node.children.map(child => (
                                    <CommentNode
                                        key={child.id}
                                        node={child}
                                        depth={depth + 1}
                                        onReply={onReply}
                                        onLike={onLike}
                                        currentUser={currentUser}
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

export default function ForumPostModal({
    post,
    user,
    onClose,
    onBumpPostComments
}) {
    const [loading, setLoading] = useState(true);
    const [commentsFlat, setCommentsFlat] = useState([]);
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

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const b = await preloadLandingSounds();
                console.log("[mini-player] preloadLandingSounds resolved:", b);
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
            console.log("[getLocalRecordingById] parsed JSON:", data);
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
        document.body.classList.add("popup-open");
        return () => {
            document.body.classList.remove("popup-open");
            stopAll();
        };
    }, [stopAll]);

    const tree = useMemo(() => buildTree(commentsFlat), [commentsFlat]);

    const toggleCollapsed = useCallback((id) => {
        setCollapsed(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    }, []);

    const fetchComments = useCallback(async () => {
        if (firstLoadRef.current) setLoading(true);
        const prevY = listRef.current ? listRef.current.scrollTop : 0;
        try {
            const res = await fetch(`${PHP_URL}/getForumComments.php?postId=${encodeURIComponent(post.id)}`, {
                credentials: "include",
                cache: "no-store",
            });
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
                if (topLevel.length >= 5) setCollapsed(new Set([Number(topLevel[4].id)]));
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
        if (!post?.id) return;
        const url = `${PHP_URL}/commentsStream.php?postId=${encodeURIComponent(post.id)}`;
        const es = new EventSource(url, { withCredentials: false });

        es.addEventListener("open", () => console.log("[SSE] open"));
        es.addEventListener("comments", () => fetchComments());
        es.addEventListener("error", (e) => console.warn("[SSE] error", e));

        return () => es.close();
    }, [post?.id, fetchComments]);

    useEffect(() => {
        if (!post?.id) return;
        const es = new EventSource(`${PHP_URL}/commentsStream.php?postId=${encodeURIComponent(post.id)}`, { withCredentials: false });

        const onMsg = () => fetchComments();
        const onErr = () => console.warn("comments SSE disconnected");

        es.addEventListener("comments", onMsg);
        es.onmessage = onMsg;
        es.onerror = onErr;

        return () => es.close();
    }, [post?.id, fetchComments]);

    const onReply = (node) => {
        setReplyTo(node);
    };

    const onLike = async (node) => {
        if (!user) return;
        setCommentsFlat(prev => prev.map(c => {
            if (c.id !== node.id) return c;
            const goingToLike = !c.liked;
            const nextLikesFrom = goingToLike
                ? Array.from(new Set([...(c.likesFrom || []), user.username]))
                : (c.likesFrom || []).filter(u => u !== user.username);
            return {
                ...c,
                liked: goingToLike,
                likesFrom: nextLikesFrom,
                likeCount: nextLikesFrom.length,
            };
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
            likesFrom: [],
            likeCount: 0,
            created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
            liked: false,
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
            showModal("Failed to post comment.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        document.body.classList.add("popup-open");
        return () => document.body.classList.remove("popup-open");
    }, []);

    if (!post) return null;

    return (
        <div className="post-modal-overlay" onMouseDown={onClose}>
            <div className="post-modal" onMouseDown={(e) => e.stopPropagation()}>
                <div className="post-modal-header">
                    <h2 className="post-modal-title">{post.title}</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <div className="post-modal-body">
                    <div className="post-modal-post">
                        <div className="pmp-author-line">
                            <span className="author-name">by {post.author}</span>
                            {!!post.created_at && (
                                <>
                                    <span className="ab-comment-dot">•</span>
                                    <span className="post-time">{formatCreated(post.created_at)}</span>
                                </>
                            )}
                        </div>
                        <div className="pmp-content">{post.content}</div>
                        <div className="pmp-tags">
                            {post.tags?.map(t => <span key={t} className="post-tag">{t}</span>)}
                        </div>
                        <div className="pmp-stats">
                            <span>{post.likes ?? 0} likes</span>
                            <span>{post.comments ?? 0} comments</span>
                        </div>

                        <div className="pmp-attached-recording">
                            {recLoading && <div className="ab-loading">Loading recording…</div>}
                            {!recLoading && recErr && (
                                <div className="ab-error" role="alert">{recErr}</div>
                            )}
                            {!recLoading && !recErr && recMeta && Array.isArray(recNotes) && recNotes.length > 0 && (
                                <div className="ab-mini-player">
                                    <div className="ab-mini-player-meta">
                                        <strong>{recMeta.title}</strong>
                                        {recMeta.description ? <span className="ab-mini-desc"> – {recMeta.description}</span> : null}
                                    </div>
                                    <div className="ab-mini-player-controls">
                                        <button
                                            type="button"
                                            className="ab-mini-play"
                                            onClick={() => (isPlaying ? stopAll() : onPlay())}
                                            disabled={!buffers}
                                        >
                                            {isPlaying ? "⏹ Stop" : "▶ Play"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {postError && (
                        <div className="ab-error" role="alert" aria-live="assertive">
                            {postError}
                        </div>
                    )}
                    <form className="ab-new-comment" onSubmit={submitComment}>
                        <textarea
                            placeholder={user ? "Write a comment…" : "Login to comment"}
                            value={draft}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (v.length <= 500) setDraft(v);
                            }}
                            disabled={!user || submitting}
                            rows={replyTo ? 3 : 4}
                        />
                        <div className="ab-new-comment-meta">
                            <span className={`char-count ${draft.length >= 500 ? "limit-reached" : ""}`}>
                                {draft.length}/500
                            </span>
                        </div>
                        <div className="ab-new-comment-actions">
                            {replyTo && (
                                <div className="ab-replying-to">
                                    Replying to <b>{replyTo.author}</b>
                                    <button type="button" className="ab-cancel-reply" onClick={() => setReplyTo(null)}>Cancel</button>
                                </div>
                            )}
                            <button
                                className="submit-btn"
                                type="submit"
                                disabled={!user || submitting || !draft.trim()}
                            >
                                {submitting ? "Posting…" : "Post"}
                            </button>
                        </div>
                    </form>
                    <div className="ab-comments-list" ref={listRef}>
                        {loading ? (
                            <div className="ab-loading">Loading comments…</div>
                        ) : tree.length === 0 ? (
                            <div className="ab-empty">Be the first to comment!</div>
                        ) : (
                            tree.map(node => (
                                <CommentNode
                                    key={node.id}
                                    node={node}
                                    depth={0}
                                    onReply={onReply}
                                    onLike={onLike}
                                    currentUser={user}
                                    collapsedSet={collapsed}
                                    toggleCollapsed={toggleCollapsed}
                                />
                            ))
                        )}
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
        </div>
    );
}