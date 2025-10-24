// src/app/routes/forum/mobile_post_modal.js
import { useCallback, useEffect, useMemo, useState } from "react";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/Gregs_temp/php";

// --- utils ---
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

/**
 * MobilePostModal
 * Props:
 *  - post: { id, title, content, tags, author, created_at, likes, comments, ...}
 *  - user: { id, username, ... } | null
 *  - onClose: () => void
 *  - onBumpPostComments?: (postId:number)=>void
 */
export default function MobilePostModal({ post, user, onClose, onBumpPostComments }) {
  const [commentsFlat, setCommentsFlat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
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

      // default: collapse the 5th top-level comment
      const topLevel = rows.filter(r => !r.parentId);
      if (topLevel.length >= 5) {
        setCollapsed(new Set([Number(topLevel[4].id)]));
      } else {
        setCollapsed(new Set());
      }
    } catch (e) {
      console.error("Failed to fetch comments:", e);
      setCommentsFlat([]);
    } finally {
      setLoading(false);
    }
  }, [post.id, user?.username]);

  useEffect(() => {
    document.body.classList.add("popup-open"); // prevent background scroll
    fetchComments();
    const interval = setInterval(fetchComments, 8000); // light polling
    const onFocus = () => fetchComments();
    const onVisibility = () => document.visibilityState === "visible" && fetchComments();

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.body.classList.remove("popup-open");
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchComments]);

  const onReply = (node) => setReplyTo(node);

  const onLike = async (node) => {
    if (!user) return;
    // optimistic
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
      fetchComments(); // rollback to server state
      alert("Failed to like/unlike. Please try again.");
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
      likesFrom: [user.username], // auto-like by commenter locally too
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
          // optional fallback if your PHP still accepts these:
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
      alert("Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) return null;

  return (
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
                  <span className="m-post-time">Created {timeAgoTS(post.created_at)} ago</span>
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
          </div>

          <form className="m-new-comment" onSubmit={submitComment}>
            <textarea
              placeholder={user ? "Write a comment…" : "Login to comment"}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              disabled={!user || submitting}
              rows={replyTo ? 3 : 4}
            />
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

          <div className="m-comments-list">
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
  );
}
