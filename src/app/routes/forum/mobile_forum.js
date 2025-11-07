import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import MobilePostModal from "./mobile_post_modal";
import "./mobile_forum.css";


const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function MobileForum() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortBy, setSortBy] = useState("recent");
    const [user, setUser] = useState(null);
    const [activeView, setActiveView] = useState("community");
    const [showFilters, setShowFilters] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [openPost, setOpenPost] = useState(null);
    const location = useLocation();
    const [myRecordings, setMyRecordings] = useState([]);
    const [recsLoading, setRecsLoading] = useState(false);
    const [selectedRecordingId, setSelectedRecordingId] = useState(null);

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
    function truncate20(s) {
        if (!s) return "";
        return s.length > 20 ? s.slice(0, 20) + "..." : s;
    }

    const fetchMyRecordings = useCallback(async () => {
        if (!user?.id) return;
        try {
            setRecsLoading(true);
            // same cookie trick you used on desktop
            const cookiePairs = document.cookie.split("; ").map(c => c.split("="));
            const cookieMap = Object.fromEntries(cookiePairs);
            const authCookie = cookieMap["auth_token"] || "";

            const res = await fetch(`${PHP_URL}/getLocalRecordings.php`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ auth_token: authCookie }),
                cache: "no-store",
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            const list = (data?.recordings || []).map(r => ({
                id: Number(r.id),
                title: r.title ?? `Recording #${r.id}`,
            }));
            setMyRecordings(list);
        } catch (e) {
            console.error("Failed to load recordings:", e);
            setMyRecordings([]);
        } finally {
            setRecsLoading(false);
        }
    }, [user?.id]);

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
                        recording_id:
                            p.recording_id === null || p.recording_id === undefined
                                ? null
                                : Number(p.recording_id),
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

    useEffect(() => {
        if (location.state && location.state.activeView) {
            setActiveView(location.state.activeView);
        }
    }, [location.state]);

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
    const handleNewPost = async () => {
        setShowNewPostPopup(true);
        setSelectedRecordingId(null);
        await fetchMyRecordings();
    };

    const handleClosePopup = () => {
        setShowNewPostPopup(false);
        setNewPostTitle("");
        setNewPostContent("");
        setNewPostTags([]);
        setSelectedRecordingId(null);
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
            recording_id: selectedRecordingId ?? null,

        };

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
            recording_id: selectedRecordingId ?? null,

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

    if (loading) {
        return <div className="mobile-loading">Loading...</div>;
    }

    return (
        <div className="mobile-forum-page">
            {/* Mobile Header */}
            <header className="mobile-header">
                <div className="mobile-header-left">
                    <button
                        className="mobile-menu-btn"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <Link to="/" className="mobile-logo">
                        <span className="material-symbols-outlined paw-icon">pets</span>
                        <span className="mobile-site-title">ANIMALBAND</span>
                    </Link>
                </div>

                <div className="mobile-header-right">
                    {user ? (
                        <img
                            src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/${user.profilePic}`}
                            alt="Profile"
                            className="mobile-profile-pic"
                            onClick={handleAccountClick}
                        />
                    ) : (
                        <button
                            className="mobile-login-btn"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </button>
                    )}
                </div>
            </header>

            {/* Mobile Navigation Menu */}
            {showMobileMenu && (
                <div className="mobile-nav-menu">
                    <div className="mobile-nav-header">
                        <h3>Menu</h3>
                        <button
                            className="mobile-close-btn"
                            onClick={() => setShowMobileMenu(false)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <nav className="mobile-nav">
                        <button
                            className="mobile-nav-btn"
                            onClick={() => { navigate("/"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">home</span>
                            Home
                        </button>
                        <button
                            className={`mobile-nav-btn ${activeView === "community" ? "active" : ""}`}
                            onClick={() => { setActiveView("community"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">forum</span>
                            Forum
                        </button>
                        <button
                            className={`mobile-nav-btn ${activeView === "my-posts" ? "active" : ""}`}
                            onClick={() => { setActiveView("my-posts"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">article</span>
                            My Posts
                        </button>
                        <button
                            className={`mobile-nav-btn ${activeView === "my-likes" ? "active" : ""}`}
                            onClick={() => { setActiveView("my-likes"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">favorite</span>
                            My Likes
                        </button>
                        <button
                            className="mobile-nav-btn"
                            onClick={() => { navigate("/my-recordings"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">mic</span>
                            My Recordings
                        </button>
                        <button
                            className="mobile-nav-btn"
                            onClick={() => { navigate("/account"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">person</span>
                            My Profile
                        </button>
                        <button
                            className="mobile-nav-btn logout"
                            onClick={() => { navigate("/login"); setShowMobileMenu(false); }}
                        >
                            <span className="material-symbols-outlined">logout</span>
                            Log Out
                        </button>
                    </nav>
                </div>
            )}

            {/* Main Content */}
            <main className="mobile-main">
                {/* Page Header */}
                <div className="mobile-page-header">
                    <div className="mobile-title-section">
                        <h1 className="mobile-page-title">{getViewTitle()}</h1>
                        <span className="mobile-post-count">{sortedPosts.length} posts</span>
                    </div>

                    <div className="mobile-search-section">
                        <div className="mobile-search-bar">
                            <input
                                type="text"
                                placeholder="Search post or users"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <span className="material-symbols-outlined search-icon">search</span>
                        </div>
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="mobile-filter-controls">
                    <button
                        className="mobile-filter-toggle"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <span className="material-symbols-outlined">filter_list</span>
                        Filters
                        {selectedTags.length > 0 && (
                            <span className="filter-badge">{selectedTags.length}</span>
                        )}
                    </button>

                    <button className="mobile-new-post-btn" onClick={handleNewPost}>
                        <span className="material-symbols-outlined">add</span>
                        New Post
                    </button>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="mobile-filters-expanded">
                        {/* Animal Tags */}
                        <div className="mobile-filter-group">
                            <h4 className="mobile-filter-title">Animals</h4>
                            <div className="mobile-tags-grid">
                                {animalTags.map(tag => (
                                    <span
                                        key={tag}
                                        className={`mobile-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                                        onClick={() => handleTagClick(tag)}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Sound Tags */}
                        <div className="mobile-filter-group">
                            <h4 className="mobile-filter-title">Sounds</h4>
                            <div className="mobile-tags-grid">
                                {soundTags.map(tag => (
                                    <span
                                        key={tag}
                                        className={`mobile-tag ${selectedTags.includes(tag) ? 'active' : ''}`}
                                        onClick={() => handleTagClick(tag)}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div className="mobile-filter-group">
                            <h4 className="mobile-filter-title">Sort By</h4>
                            <div className="mobile-sort-options">
                                {sortOptions.map(option => (
                                    <button
                                        key={option}
                                        className={`mobile-sort-btn ${sortBy === option ? 'active' : ''}`}
                                        onClick={() => setSortBy(option)}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Posts List */}
                <div className="mobile-posts-container">
                    {!Array.isArray(sortedPosts) || sortedPosts.length === 0 ? (
                        <div className="mobile-no-posts">
                            <span className="material-symbols-outlined">forum</span>
                            <p>No posts found</p>
                            <button className="mobile-new-post-btn primary" onClick={handleNewPost}>
                                Create your first post
                            </button>
                        </div>
                    ) : (
                        sortedPosts.map((post) => (
                            <div
                                key={post.id}
                                className="mobile-post-card"
                                onClick={() => setOpenPost(post)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="mobile-post-header">
                                    <div className="mobile-post-author">
                                        <h3 className="mobile-post-title">{truncate20(post.title)}</h3>
                                        <span className="mobile-author-name">by {truncate20(post.author)}</span>
                                        {post.created_at && (
                                            <span className="mobile-post-time">{timeAgo(post.created_at, nowTick)}</span>
                                        )}
                                    </div>
                                    <button
                                        className={`mobile-like-btn ${post.liked ? "liked" : ""}`}
                                        onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                    >
                                        {post.liked ? "❤️" : "🤍"}
                                        <span>{post.likes}</span>
                                    </button>
                                </div>

                                <p className="mobile-post-content">{truncate20(post.content)}</p>

                                <div className="mobile-post-tags">
                                    {post.tags && post.tags.map(tag => (
                                        <span key={tag} className="mobile-post-tag">{tag}</span>
                                    ))}
                                </div>

                                <div className="mobile-post-footer">
                                    <div className="mobile-post-stats">
                                        <span className="mobile-comments">
                                            <span className="material-symbols-outlined">chat_bubble</span>
                                            {post.comments}
                                        </span>
                                    </div>
                                    <div className="mobile-post-actions">
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
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                <Link to="/stage" className="mobile-nav-item">
                    <span className="material-symbols-outlined mobile-nav-icon">piano</span>
                    <span>Stage</span>
                </Link>
                <Link to="/looping" className="mobile-nav-item">
                    <span className="material-symbols-outlined mobile-nav-icon">instant_mix</span>
                    <span>Looping</span>
                </Link>
                <Link to="/forum" className="mobile-nav-item active">
                    <span className="material-symbols-outlined mobile-nav-icon">chat</span>
                    <span>Forum</span>
                </Link>
                <Link to="/account" className="mobile-nav-item">
                    <span className="material-symbols-outlined mobile-nav-icon">person</span>
                    <span>Profile</span>
                </Link>
            </nav>

            {/* New Post Popup for Mobile */}
            {showNewPostPopup && (
                <div className="mobile-popup-overlay">
                    <div className="mobile-popup-content">
                        <div className="mobile-popup-header">
                            <h2>Create New Post</h2>
                            <button className="mobile-close-btn" onClick={handleClosePopup}>×</button>
                        </div>
                        <div className="mobile-popup-body">
                            <div className="mobile-form-group">
                                <label>Title:</label>
                                <input
                                    type="text"
                                    value={newPostTitle}
                                    onChange={(e) => setNewPostTitle(e.target.value)}
                                    placeholder="Enter post title"
                                />
                            </div>
                            <div className="mobile-form-group">
                                <label>Content:</label>
                                <textarea
                                    value={newPostContent}
                                    onChange={(e) => setNewPostContent(e.target.value)}
                                    placeholder="Enter post content"
                                    rows="4"
                                />
                            </div>
                            <div className="mobile-form-group">
                                <label>Tags:</label>
                                <div className="mobile-tag-selection">
                                    {animalTags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`mobile-tag ${newPostTags.includes(tag) ? 'active' : ''}`}
                                            onClick={() => handleTagSelect(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                    {soundTags.map(tag => (
                                        <span
                                            key={tag}
                                            className={`mobile-tag ${newPostTags.includes(tag) ? 'active' : ''}`}
                                            onClick={() => handleTagSelect(tag)}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="mobile-form-group">
                                <label>Attach Recording (optional):</label>
                                <div className="m-recording-select-wrap">
                                    <select
                                        className="m-recording-select"
                                        value={selectedRecordingId ?? ""}
                                        onChange={(e) => {
                                            const v = e.target.value;
                                            setSelectedRecordingId(v === "" ? null : Number(v));
                                        }}
                                        disabled={recsLoading || !user}
                                    >
                                        <option value="">None</option>
                                        {myRecordings.map(r => (
                                            <option key={r.id} value={r.id}>{r.title}</option>
                                        ))}
                                    </select>
                                </div>
                                {recsLoading && <small className="m-recording-select-hint">Loading your recordings…</small>}
                            </div>

                        </div>
                        <div className="mobile-popup-footer">
                            <button className="mobile-cancel-btn" onClick={handleClosePopup}>Cancel</button>
                            <button
                                type="button"
                                className="mobile-submit-btn"
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
                <MobilePostModal
                    post={openPost}
                    user={user}
                    onClose={() => setOpenPost(null)}
                    onBumpPostComments={() => refreshNoJump()}
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