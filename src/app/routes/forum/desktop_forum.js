import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import "./desktop_forum.css";
import ForumPostModal from "./desktop_forum_post";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/Gregs_temp/php";

export default function DesktopForum() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortBy, setSortBy] = useState("recent");
    const [user, setUser] = useState(null);
    const [activeView, setActiveView] = useState("community");
    const [openPost, setOpenPost] = useState(null);

    // ========== New post popup ==========
    const [showNewPostPopup, setShowNewPostPopup] = useState(false);
    const [newPostTitle, setNewPostTitle] = useState("");
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostTags, setNewPostTags] = useState([]);

    // ========== Tags and sorting stuff ==========
    const animalTags = ["Hamster", "Cockatiel", "Emu", "Kangaroo", "Snake", "Ostrich"];
    const soundTags = ["Song Recording"];
    const sortOptions = ["recent", "likes"];

    // ========== Date and Time whatnot ==========
    const [nowTick, setNowTick] = useState(Date.now());
    function parseDbTimestamp(s) {
        if (!s) return null;
        const iso = s.replace(' ', 'T');
        const d = new Date(iso);
        return isNaN(d.getTime()) ? null : d;
    }

    function timeAgo(createdAt, now = Date.now()) {
        const d = typeof createdAt === 'string' ? parseDbTimestamp(createdAt) :
            createdAt instanceof Date ? createdAt : null;
        if (!d) return '';

        const diffMs = Math.max(0, now - d.getTime());
        const sec = Math.floor(diffMs / 1000);
        const min = Math.floor(sec / 60);
        const hr = Math.floor(min / 60);
        const day = Math.floor(hr / 24);

        if (sec < 45) return 'just now';
        if (min < 60) return `${min}m`;
        if (hr < 24) return `${hr}h`;
        if (day === 1) return 'yesterday';
        if (day < 7) return `${day}d`;

        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }

    useEffect(() => {
        const id = setInterval(() => setNowTick(Date.now()), 60_000);
        return () => clearInterval(id);
    }, []);




    // ========== Fetch Posts ==========
    const fetchPosts = useCallback(async (opts = { refresh: false }) => {
        const { refresh } = opts;
        refresh ? setRefreshing(true) : setLoading(true);
        try {
            const res = await fetch(`${PHP_URL}/getforumPosts.php`, {
                credentials: "include",
                cache: "no-store",
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const rows = await res.json();

            setPosts(prev => {
                const prevById = new Map(prev.map(p => [p.id, p]));

                return rows.map(p => {
                    const likesFrom = Array.isArray(p.likesFrom) ? p.likesFrom : [];
                    const base = {
                        id: Number(p.id),
                        title: p.title || "",
                        content: p.content || "",
                        tags: Array.isArray(p.tags) ? p.tags : [],
                        author: p.author || "",
                        authorId: Number(p.authorId ?? 0),
                        likes: Number(p.likeCount ?? 0),
                        comments: Number(p.comments ?? 0),
                        created_at: p.created_at || null,
                        likesFrom,
                    };

                    const prevLiked = prevById.get(base.id)?.liked ?? false;
                    const liked = user ? likesFrom.includes(user.username) : prevLiked;
                    return { ...base, liked };
                });
            });
        } catch (e) {
            console.error("Failed to fetch posts:", e);
            if (!refresh) setPosts([]);
        } finally {
            refresh ? setRefreshing(false) : setLoading(false);
        }
    }, [user?.username]);

    // ========== Don't jump pls when refresh ty ==========
    const refreshNoJump = useCallback(async () => {
        const y = window.scrollY;
        await fetchPosts({ refresh: true });
        window.scrollTo({ top: y, behavior: "instant" });
    }, [fetchPosts]);

    // ========== Fetch user data ========== 
    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch(
                    `${PHP_URL}/getUser.php`,
                    { credentials: "include" }
                );
                const data = await res.json();
                if (data.loggedIn) {
                    setUser(data);
                }
                else {
                    navigate("/login");
                }
            } catch (err) {
                console.error("Failed to fetch user", err);
            }
        };


        checkUser();
        fetchPosts();
    }, [navigate, fetchPosts]);

    // ========== Compute liked ==========
    useEffect(() => {
        if (!user) return;
        setPosts((prev) =>
            prev.map((p) => ({
                ...p,
                liked: Array.isArray(p.likesFrom) && p.likesFrom.includes(user.username),
            }))
        );
    }, [user]);

    // ========== Server event polling ==========
    useEffect(() => {
        const es = new EventSource(`${PHP_URL}/postsStream.php`, { withCredentials: false });

        const onMsg = (e) => {
            fetchPosts({ refresh: true });
        };
        const onErr = () => {
            console.warn("SSE disconnected");
        };

        es.addEventListener("posts", onMsg);
        es.onmessage = onMsg;
        es.onerror = onErr;

        return () => es.close();
    }, [fetchPosts]);


    const handleAccountClick = () => {
        if (user) {
            navigate("/account");
        } else {
            navigate("/login");
        }
    };

    // ========== Like Button ==========
    const toggleLike = async (postId) => {
        if (!user) return;

        setPosts(prev => prev.map(p => {
            if (p.id !== postId) return p;
            const goingToLike = !p.liked;
            const nextLikesFrom = goingToLike
                ? Array.from(new Set([...(p.likesFrom || []), user.username]))
                : (p.likesFrom || []).filter(u => u !== user.username);

            return {
                ...p,
                liked: goingToLike,
                likesFrom: nextLikesFrom,
                likes: nextLikesFrom.length,
            };
        }));

        try {
            const res = await fetch(`${PHP_URL}/likeForumPost.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ postId }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || `HTTP ${res.status}`);

            setPosts(prev => prev.map(p =>
                p.id === postId
                    ? { ...p, likes: data.likeCount, liked: data.liked, likesFrom: data.likesFrom }
                    : p
            ));
        } catch (err) {
            console.error("toggleLike failed:", err);
            setPosts(prev => prev.map(p => {
                if (p.id !== postId) return p;
                const rolledBack = !p.liked;
                const nextLikesFrom = rolledBack
                    ? Array.from(new Set([...(p.likesFrom || []), user.username]))
                    : (p.likesFrom || []).filter(u => u !== user.username);

                return {
                    ...p,
                    liked: rolledBack,
                    likesFrom: nextLikesFrom,
                    likes: nextLikesFrom.length,
                };
            }));
            alert("Failed to like/unlike. Please try again.");
        }
    };


    // ========== Tags ==========
    const handleTagClick = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // ========== New Post ==========
    const handleNewPost = () => {
        setShowNewPostPopup(true);
    };

    const handleClosePopup = () => {
        setShowNewPostPopup(false);
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostTags([]);
    };

    const handleTagSelect = (tag) => {
        setNewPostTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };
    // ========== Handle post submission ==========
    const handleSubmitPost = async (e) => {
        if (e && typeof e.preventDefault === "function") e.preventDefault();
        if (!user) {
            return;
        }
        if (!user.id) {
            return;
        }
        const payload = {
            title: newPostTitle.trim(),
            content: newPostContent.trim(),
            tags: newPostTags,
            likesFrom: [user.username],
            author: user.username,
            authorId: user.id,
            likes: 1,

        };

        // console.log("New Post Data Saved:", {
        //     title: title,
        //     content: content,
        //     tags: tags,
        //     likesFrom: likesFrom,
        //     author: author,
        //     authorId: authorId,
        //     likeCount: likeCount

        // });
        const tempId = Date.now();
        const optimistic = {
            id: tempId,
            title: newPostTitle.trim(),
            content: newPostContent.trim(),
            tags: newPostTags,
            author: user.username,
            authorId: user.id,
            likes: 1,
            comments: 0,
            created_at: new Date().toISOString(),
            likesFrom: [user.username],
            liked: true,
        };
        setPosts(prev => [optimistic, ...prev]);
        try {
            const url = `${PHP_URL}/makeForumPost.php`;
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });
            const text = await response.text();
            if (!response.ok) {
                throw new Error(`Request failed. Status ${response.status}`);
            }
            await refreshNoJump();
        } catch (err) {
            setPosts(prev => prev.filter(p => p.id !== tempId));
            console.error(err);
            alert("Post failed");
        }

        handleClosePopup();
    };

    // ========== Filtering ==========
    const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
        if (activeView === "my-posts" && user) {
            if (post.author !== user.username) return false;
        } else if (activeView === "my-likes") {
            if (!post.liked) return false;
        }

        // ========== Search filter ==========
        const matchesSearch = searchTerm === "" ||
            (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (post.author && post.author.toLowerCase().includes(searchTerm.toLowerCase()));

        // ========== Tag filter ==========
        const matchesTags = selectedTags.length === 0 ||
            selectedTags.some(tag => post.tags && post.tags.includes(tag));

        return matchesSearch && matchesTags;
    }) : [];

    // ========== Sort posts ==========
    const sortedPosts = Array.isArray(filteredPosts) ? [...filteredPosts].sort((a, b) => {
        switch (sortBy) {
            case "likes":
                return (b.likes || 0) - (a.likes || 0);
            case "recent":
            default:
                return (b.id || 0) - (a.id || 0);
        }
    }) : [];

    const getViewTitle = () => {
        switch (activeView) {
            case "my-posts":
                return "My Posts";
            case "my-likes":
                return "My Likes";
            case "community":
            default:
                return "Forum";
        }
    };


    return (
        <div className="forum-page">
            {/* Sidebar */}
            <aside className="forum-sidebar">
                <div className="sidebar-header">
                    <Link to="/">
                        <span className="material-symbols-outlined paw-icon">pets</span>
                        <span className="forum-site-title">ANIMALBAND</span>
                    </Link>
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/")}>Home</button></li>
                        <li>
                            <button
                                className={`df-sidebar-btn ${activeView === "community" ? "active" : ""}`}
                                onClick={() => setActiveView("community")}
                            >
                                Forum
                            </button>
                        </li>
                        <li>
                            <button
                                className={`df-sidebar-btn ${activeView === "my-posts" ? "active" : ""}`}
                                onClick={() => setActiveView("my-posts")}
                            >
                                My Posts
                            </button>
                        </li>
                        <li>
                            <button
                                className={`df-sidebar-btn ${activeView === "my-likes" ? "active" : ""}`}
                                onClick={() => setActiveView("my-likes")}
                            >
                                My Likes
                            </button>
                        </li>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/my-recordings")}>My Recordings</button></li>
                        <li><button className="df-sidebar-btn" onClick={() => navigate("/account")}>My Profile</button></li>
                        <button className="df-sidebar-btn logout-btn" onClick={() => navigate("/login")}>
                            Log Out
                        </button>
                    </ul>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="forum-main">
                {/* Header */}
                <header className="forum-header">
                    <div className="header-left">
                        <h1 className="forum-title">{getViewTitle()}</h1>
                        <span className="post-count">{sortedPosts.length} posts</span>
                    </div>

                    <div className="header-search">
                        <input
                            type="text"
                            placeholder="Search post or users"
                            className="search-bar"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="material-symbols-outlined search-icon">search</span>
                    </div>

                    <div className="header-right">
                        {/* Profile */}
                        {!user ? (
                            <div className="header-auth-buttons">
                                <button
                                    className="btn-login"
                                    onClick={() => navigate("/login")}
                                >
                                    Login
                                </button>
                                <button
                                    className="btn-register"
                                    onClick={() => navigate("/register")}
                                >
                                    Register
                                </button>
                            </div>
                        ) : (
                            <img
                                src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
                                alt="Profile"
                                className="profile-pic"
                                onClick={handleAccountClick}
                            />
                        )}
                    </div>
                </header>

                {/* Posts Section */}
                <main className="forum-content">
                    {/* Filter bar */}
                    <div className="tag-filter-bar">
                        {/* Animals */}
                        <div className="filter-section">
                            <span className="filter-title">Animals:</span>
                            {animalTags.map(tag => (
                                <span
                                    key={tag}
                                    className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => handleTagClick(tag)}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        {/* Sounds */}
                        <div className="filter-section">
                            <span className="filter-title">Sounds:</span>
                            {soundTags.map(tag => (
                                <span
                                    key={tag}
                                    className={`tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                                    onClick={() => handleTagClick(tag)}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        {/* Sort by */}
                        <div className="sort-controls">
                            <div className="control-group">
                                <span className="filter-title">Sort:</span>
                                {sortOptions.map(option => (
                                    <span
                                        key={option}
                                        className={`tag ${sortBy === option ? 'active' : ''}`}
                                        onClick={() => setSortBy(option)}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Posts */}
                    <div className="posts-container">
                        <div className="posts-header">
                            <button className="new-post-btn" onClick={handleNewPost}>
                                + Create New Post
                            </button>
                        </div>

                        {!Array.isArray(sortedPosts) || sortedPosts.length === 0 ? (
                            <div className="no-posts">
                                <p>No posts found.</p>
                            </div>
                        ) : (
                            sortedPosts.map((post) => (
                                <div key={post.id} className="post-card" onClick={() => setOpenPost(post)} role="button" tabIndex={0}>                                    <div className="post-header">
                                    <div className="post-author">
                                        <div>
                                            <h3 className="post-title">{post.title}</h3>
                                            <span className="author-name">by {post.author}</span>
                                        </div>
                                    </div>
                                    {/* Time since posted */}
                                    {post.created_at && (
                                        (() => {
                                            const ta = timeAgo(post.created_at, nowTick);
                                            return (
                                                <span className="post-time">
                                                    Created {ta === "just now" ? ta : `${ta} ago`}
                                                </span>
                                            );
                                        })()
                                    )}
                                </div>
                                    <p className="post-content">{post.content}</p>
                                    <div className="post-tags">
                                        {post.tags && post.tags.map(tag => (
                                            <span key={tag} className="post-tag">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="post-footer">
                                        <div className="post-meta">
                                            <span className="post-likes">{post.likes} likes</span>
                                            <span className="post-comments">{post.comments} comments</span>
                                        </div>
                                        <button
                                            className={`like-btn ${post.liked ? "liked" : ""}`}
                                            onClick={() => toggleLike(post.id)}
                                            aria-label={post.liked ? "Unlike post" : "Like post"}
                                        >
                                            {post.liked ? "❤️" : "🤍"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>

            {/* New Post Popup */}
            {showNewPostPopup && (
                <div className="popup-overlay">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h2>Create New Post</h2>
                            <button className="close-btn" onClick={handleClosePopup}>×</button>
                        </div>
                        <div className="popup-body">
                            <div className="form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    placeholder="Enter post title"
                                />
                            </div>
                            <div className="form-group">
                                <label>Content:</label>
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="Enter post content"
                                    rows="4"
                                />
                            </div>
                            <div className="form-group">
                                <label>Tags:</label>
                                <div className="tag-selection">
                                    {animalTags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`tag ${newPostTags.includes(tag) ? 'active' : ''}`}
                                            onClick={() => handleTagSelect(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {soundTags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`tag ${newPostTags.includes(tag) ? 'active' : ''}`}
                                            onClick={() => handleTagSelect(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button className="cancel-btn" onClick={handleClosePopup}>Cancel</button>
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={handleSubmitPost}
                                disabled={!user?.id || !newPostTitle.trim() || !newPostContent.trim()}
                            >
                                Create Post
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {openPost && (
                <ForumPostModal
                    post={openPost}
                    user={user}
                    onClose={() => setOpenPost(null)}
                    onBumpPostComments={(postId) => {
                        // simple refresh so the comment count updates in the list
                        refreshNoJump();
                    }}
                />
            )}
            {/* Material Icons */}
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                rel="stylesheet"
            />
        </div>
    );
}