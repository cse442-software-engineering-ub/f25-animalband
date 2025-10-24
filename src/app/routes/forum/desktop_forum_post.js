// src/app/routes/forum/forum_post.js
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/Gregs_temp/php";

/** Utility: DB "YYYY-MM-DD HH:MM:SS" -> Date */
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

/** Build tree {id, parentId} -> children[] */
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
    // sort children (score then date)
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

/** Single comment node (recursive) */
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

/** Modal for a single forum post with comments */
export default function ForumPostModal({
    post,
    user,
    onClose,
    onBumpPostComments // optional: refresh parent post comment count
}) {
    const [loading, setLoading] = useState(true);
    const [commentsFlat, setCommentsFlat] = useState([]); // flat array from server
    const [replyTo, setReplyTo] = useState(null); // node being replied to
    const [draft, setDraft] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [collapsed, setCollapsed] = useState(() => new Set());

    const tree = useMemo(() => buildTree(commentsFlat), [commentsFlat]);

    const toggleCollapsed = useCallback((id) => {
        setCollapsed(prev => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id); else n.add(id);
            return n;
        });
    }, []);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${PHP_URL}/getForumComments.php?postId=${encodeURIComponent(post.id)}`, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rows = await res.json();
            setCommentsFlat(rows.map(r => ({
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
            })));
        } catch (e) {
            console.error("Failed to fetch comments:", e);
            setCommentsFlat([]);
        } finally {
            setLoading(false);
        }
    }, [post.id, user?.username]);

    useEffect(() => {
        if (post?.id) fetchComments();
    }, [post?.id, fetchComments]);

    const onReply = (node) => {
        setReplyTo(node);
    };

    const onLike = async (node) => {
        if (!user) return;
        // optimistic
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
            // sync to server values
            setCommentsFlat(prev => prev.map(c => c.id === node.id
                ? { ...c, liked: data.liked, likeCount: data.likeCount, likesFrom: data.likesFrom }
                : c
            ));
        } catch (err) {
            console.error("like comment failed:", err);
            // rollback by refetching for correctness
            fetchComments();
            alert("Failed to like/unlike. Please try again.");
        }
    };

    const submitComment = async (e) => {
        e?.preventDefault?.();
        if (!user || !draft.trim()) return;
        setSubmitting(true);

        // optimistic placeholder
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

            // update list with real record (and bump counter on parent)
            await fetchComments();
            onBumpPostComments?.(post.id); // tells parent to refresh post comment count
            setReplyTo(null);
        } catch (err) {
            console.error("comment failed:", err);
            // rollback optimistic
            setCommentsFlat(prev => prev.filter(c => c.id !== tempId));
            alert("Failed to post comment.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        // trap scroll behind modal
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
                                    <span className="post-time">Created {timeAgoTS(post.created_at)} ago</span>
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
                    </div>

                    <form className="ab-new-comment" onSubmit={submitComment}>
                        <textarea
                            placeholder={user ? "Write a comment…" : "Login to comment"}
                            value={draft}
                            onChange={e => setDraft(e.target.value)}
                            disabled={!user || submitting}
                            rows={replyTo ? 3 : 4}
                        />
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

                    <div className="ab-comments-list">
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
        </div>
    );
}
