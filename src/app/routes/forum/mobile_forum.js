import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./mobile_forum.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function MobileForum() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [sortBy, setSortBy] = useState("recent");
    const [user, setUser] = useState(null);
    const [activeView, setActiveView] = useState("community");
    const [showFilters, setShowFilters] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const location = useLocation();

    // Tags and sorting stuff
    const animalTags = ["Hamster", "Cockatiel", "Emu", "Kangaroo", "Snake", "Ostrich"];
    const soundTags = ["Song Recording"];
    const sortOptions = ["recent", "likes"];
    useEffect(() => {
        if (location.state && location.state.activeView) {
            setActiveView(location.state.activeView);
        }
    }, [location.state]);
    useEffect(() => {
        // Fetch user data
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
        // Fetch Posts
        const fetchPosts = async () => {
            try {
                // TODO: backend
                const tempPosts = [
                    {
                        id: 1,
                        title: "Title1",
                        content: "Hello there",
                        tags: ["Hamster"],
                        liked: false,
                        author: "test",
                        authorId: 1,
                        likes: 15,
                        comments: 3,
                    },
                    {
                        id: 2,
                        title: "Title2",
                        content: "General Kenobi",
                        tags: ["Cockatiel"],
                        liked: true,
                        author: "AnimalLover2",
                        authorId: 2,
                        likes: 42,
                        comments: 7,
                    },
                    {
                        id: 3,
                        title: "Title3",
                        content: "You are",
                        tags: ["Emu"],
                        liked: false,
                        author: "AnimalLover3",
                        authorId: 3,
                        likes: 28,
                        comments: 4,
                    },
                    {
                        id: 4,
                        title: "Title4",
                        content: "A bold one",
                        tags: ["Kangaroo"],
                        liked: true,
                        author: "AnimalLover4",
                        authorId: 4,
                        likes: 67,
                        comments: 12,
                    }
                ];
                setPosts(tempPosts);
            } catch (error) {
                console.error("Failed to fetch posts:", error);
                setPosts([]);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
        fetchPosts();
    }, []);

    const handleAccountClick = () => {
        if (user) {
            navigate("/account");
        } else {
            navigate("/login");
        }
    };

    // Like Button:
    const toggleLike = async (postId) => {
        try {
            // TODO: Implement like btn backend
            setPosts(prev => prev.map(post =>
                post.id === postId
                    ? {
                        ...post,
                        liked: !post.liked,
                        likes: post.liked ? post.likes - 1 : post.likes + 1
                    }
                    : post
            ));
        } catch (error) {
            console.error("Failed to toggle like:", error);
        }
    };

    // Tags
    const handleTagClick = (tag) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    // ToDo: New Post stuff
    const handleNewPost = () => {
        console.log("New Post btn works");
    };

    // Filtering
    const filteredPosts = Array.isArray(posts) ? posts.filter(post => {
        if (activeView === "my-posts" && user) {
            if (post.author !== user.username) return false;
        } else if (activeView === "my-likes") {
            if (!post.liked) return false;
        }

        // Search filter
        const matchesSearch = searchTerm === "" ||
            (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (post.content && post.content.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (post.author && post.author.toLowerCase().includes(searchTerm.toLowerCase()));

        // Tag filter
        const matchesTags = selectedTags.length === 0 ||
            selectedTags.some(tag => post.tags && post.tags.includes(tag));

        return matchesSearch && matchesTags;
    }) : [];

    // Sort posts
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
                            <div key={post.id} className="mobile-post-card">
                                <div className="mobile-post-header">
                                    <div className="mobile-post-author">
                                        <h3 className="mobile-post-title">{post.title}</h3>
                                        <span className="mobile-author-name">by {post.author}</span>
                                    </div>
                                    <button
                                        className={`mobile-like-btn ${post.liked ? "liked" : ""}`}
                                        onClick={() => toggleLike(post.id)}
                                    >
                                        {post.liked ? "❤️" : "🤍"}
                                        <span>{post.likes}</span>
                                    </button>
                                </div>

                                <p className="mobile-post-content">{post.content}</p>

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
                                        <button className="mobile-action-btn">
                                            <span className="material-symbols-outlined">share</span>
                                        </button>
                                        <button className="mobile-action-btn">
                                            <span className="material-symbols-outlined">bookmark</span>
                                        </button>
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

            {/* Material Icons */}
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                rel="stylesheet"
            />
        </div>
    );
}