// desktop_forum.js
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import "./desktop_forum.css";
import { SOUND_CONFIG } from "../stage/stage_soundsConfig";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function DesktopForum() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // New-post state
  const [showNewPostPopup, setShowNewPostPopup] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState([]);
  const [selectedRecordingId, setSelectedRecordingId] = useState(null);
  
  // recordings
  const [userRecordings, setUserRecordings] = useState([]);

  const animalTags = ["Hamster", "Cockatiel", "Emu", "Kangaroo", "Snake", "Ostrich"];
  const soundTags = ["Song Recording"];
  const sortOptions = ["recent", "likes"];
  const [sortBy, setSortBy] = useState("recent");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [activeView, setActiveView] = useState("community");

  // --- Fetch current user using auth_token cookie ---
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch(`${PHP_URL}/getUser.php`, { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.loggedIn) setUser(data);
        else navigate("/login");
      } catch (err) {
        console.error("getUser failed:", err);
        // fallback: navigate to login only if response indicates logged out
      }
    }
    checkUser();
  }, [navigate]);

  // --- Fetch posts ---
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${PHP_URL}/getforumPosts.php`, { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      // rows should be an array of posts
      setPosts((rows || []).map(p => ({
        id: Number(p.id),
        title: p.title || "",
        content: p.content || "",
        tags: Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? JSON.parse(p.tags || "[]") : []),
        author: p.author || "",
        authorId: Number(p.authorId ?? 0),
        likes: Number(p.likeCount ?? p.likesCount ?? 0),
        comments: Number(p.comments ?? 0),
        created_at: p.created_at || null,
        liked: user ? (Array.isArray(p.likesFrom) ? p.likesFrom.includes(user.username) : false) : false,
        recording_id: p.recordingId ?? p.recording_id ?? null,
      })));
    } catch (err) {
      console.error("Failed to fetch posts:", err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user]);
  
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

// --- Fetch user's recordings on forum load so playback always works ---
const fetchUserRecordings = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${PHP_URL}/getUserRecordings.php`, {
        credentials: "include",
        cache: "no-store"
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUserRecordings(Array.isArray(data.recordings) ? data.recordings : []);
    } catch (err) {
      console.error("Failed to fetch user recordings:", err);
      setUserRecordings([]);
    }
  };

  useEffect(() => {
  fetchUserRecordings();
}, [user]);


  // open new-post UI
  const handleNewPost = () => {
    setShowNewPostPopup(true);
    setSelectedRecordingId(null);
  };

  // create post
  const handleSubmitPost = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!user) { alert("Not logged in"); return; }
    const payload = {
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      tags: newPostTags,
      likesFrom: [user.username],
      author: user.username,
      authorId: user.id,
      likes: 1,
      recordingId: selectedRecordingId ? Number(selectedRecordingId) : null
    };
    // optimistic UI
    const tempId = Date.now();
    setPosts(prev => [{
      ...payload,
      id: tempId,
      comments: 0,
      created_at: new Date().toISOString(),
      liked: true,
    }, ...prev]);

    try {
      const res = await fetch(`${PHP_URL}/makeForumPost.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      if (!body.success) throw new Error(body.message || "Post rejected");
      await fetchPosts();
    } catch (err) {
      console.error("Create post failed:", err);
      setPosts(prev => prev.filter(p => p.id !== tempId));
      alert("Failed to create post");
    } finally {
      setShowNewPostPopup(false);
      setNewPostTitle(""); setNewPostContent(""); setNewPostTags([]); setSelectedRecordingId(null);
    }
  };

// --- Play recording attached to a post ---
const playRecordingFromPost = (recordingJson) => {
  if (!recordingJson) return;

  let events;
  try {
    events = Array.isArray(recordingJson)
      ? recordingJson
      : JSON.parse(recordingJson);
  } catch (err) {
    console.error("Failed to parse recording JSON:", err);
    alert("Recording data is corrupted!");
    return;
  }

  if (!events.length) {
    console.warn("Recording is empty");
    return;
  }

  events.forEach(event => {
    if (!event.key || typeof event.time !== "number") return;

    const sound = SOUND_CONFIG.find(s => s.key === event.key);
    if (!sound) {
      console.warn(`No sound mapping for key: ${event.key}`);
      return;
    }

    const audioPath = `${process.env.PUBLIC_URL}/stage_sounds/${sound.file}`;
    const audio = new Audio(audioPath);

    // ensure play is triggered by user interaction
    setTimeout(() => {
      audio.play().catch(err => {
        console.error(`Failed to play audio (${audioPath}):`, err);
      });
    }, event.time);
  });
};




  // small helpers for filtering/sorting
  const toggleTag = (t) => setSelectedTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  const filteredPosts = posts.filter(p => {
    if (activeView === "my-posts" && user && p.author !== user.username) return false;
    if (activeView === "my-likes" && !p.liked) return false;
    const search = searchTerm.trim().toLowerCase();
    if (search) {
      if (!([p.title, p.content, p.author].some(s => s && s.toLowerCase().includes(search)))) return false;
    }
    if (selectedTags.length && !(selectedTags.some(tag => p.tags && p.tags.includes(tag)))) return false;
    return true;
  });

  const sortedPosts = [...filteredPosts].sort((a,b) => {
    if (sortBy === "likes") return (b.likes||0) - (a.likes||0);
    return (b.id||0) - (a.id||0);
  });

  return (
    <div className="forum-page">
      <aside className="forum-sidebar">
        <div className="sidebar-header">
          <Link to="/"><span className="material-symbols-outlined paw-icon">pets</span><div className="forum-site-title">ANIMALBAND</div></Link>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><button className="df-sidebar-btn" onClick={()=>navigate("/")}>Home</button></li>
            <li><button className={`df-sidebar-btn ${activeView==="community"?"active":""}`} onClick={()=>setActiveView("community")}>Forum</button></li>
            <li><button className={`df-sidebar-btn ${activeView==="my-posts"?"active":""}`} onClick={()=>setActiveView("my-posts")}>My Posts</button></li>
            <li><button className={`df-sidebar-btn ${activeView==="my-likes"?"active":""}`} onClick={()=>setActiveView("my-likes")}>My Likes</button></li>
            <li><button className="df-sidebar-btn" onClick={()=>navigate("/my-recordings")}>My Recordings</button></li>
            <li><button className="df-sidebar-btn" onClick={()=>navigate("/account")}>My Profile</button></li>
            <li><button className="df-sidebar-btn logout-btn" onClick={()=>navigate("/login")}>Log Out</button></li>
          </ul>
        </nav>
      </aside>

      <div className="forum-main">
        <header className="forum-header">
          <div className="header-left">
            <h1 className="forum-title">{activeView === "community"? "Forum" : activeView === "my-posts" ? "My Posts" : "My Likes"}</h1>
            <span className="post-count">{sortedPosts.length} posts</span>
          </div>

          <div className="header-search">
            <input className="search-bar" placeholder="Search post or users" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
            <span className="material-symbols-outlined search-icon">search</span>
          </div>

          <div className="header-right">
            {!user ? (
              <>
                <button className="nav-btn" onClick={()=>navigate("/login")}>Login</button>
                <button className="nav-btn" onClick={()=>navigate("/register")}>Register</button>
              </>
            ) : (
              <img src={`${PHP_URL}/${user.profilePic || ""}`} alt="Profile" className="profile-pic" onClick={()=>navigate("/account")} />
            )}
          </div>
        </header>

        <main className="forum-content">
          <div className="tag-filter-bar">
            <div className="filter-section">
              <span className="filter-title">Animals:</span>
              {animalTags.map(t => <span key={t} className={`tag ${selectedTags.includes(t)?"active":""}`} onClick={()=>toggleTag(t)}>{t}</span>)}
            </div>
            <div className="filter-section">
              <span className="filter-title">Sounds:</span>
              {soundTags.map(t => <span key={t} className={`tag ${selectedTags.includes(t)?"active":""}`} onClick={()=>toggleTag(t)}>{t}</span>)}
            </div>
            <div className="sort-controls">
              <div className="control-group">
                <span className="filter-title">Sort:</span>
                {sortOptions.map(opt => <span key={opt} className={`tag ${sortBy===opt?"active":""}`} onClick={()=>setSortBy(opt)}>{opt}</span>)}
              </div>
            </div>
          </div>

          <div className="posts-container">
            <div className="posts-header">
              <button className="new-post-btn" onClick={handleNewPost}>+ Create New Post</button>
            </div>

            {loading ? <div className="no-posts"><p>Loading...</p></div> : (
              sortedPosts.length === 0 ? <div className="no-posts"><p>No posts found.</p></div> :
              sortedPosts.map(post => (
                <div key={post.id} className="post-card">
                  <div className="post-header">
                    <h3 className="post-title">{post.title}</h3>
                    {post.created_at && <span className="post-time">{new Date(post.created_at).toLocaleString()}</span>}
                  </div>
                  <p className="post-content">{post.content}</p>
                  <div className="post-tags">{post.tags && post.tags.map(tag => <span className="post-tag" key={tag}>{tag}</span>)}</div>
                  <div className="post-footer">
                    <div className="post-meta">
                      <span className="post-likes">{post.likes} likes</span>
                      <span className="post-comments">{post.comments} comments</span>
                    </div>
                    <div className="post-actions">
                    {post.recording_id && (
  <button
    className="play-recording-btn"
    onClick={() => {
      const recObj = userRecordings.find(r => r.id === Number(post.recording_id));
      if (!recObj) return;

      playRecordingFromPost(recObj.recording);
    }}
  >
    ▶ Play Recording
  </button>
)}


                      <button
  className={`like-btn ${post.liked ? "liked" : ""}`}
  aria-label={post.liked ? "Unlike" : "Like"}
  onClick={() => toggleLike(post.id)}
>
  {post.liked ? "❤️" : "🤍"}
</button>

                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* New post modal */}
      {showNewPostPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <div className="popup-header">
              <h2>Create New Post</h2>
              <button className="close-btn" onClick={()=>setShowNewPostPopup(false)}>×</button>
            </div>
            <div className="popup-body">
              <div className="form-group">
                <label>Title:</label>
                <input type="text" value={newPostTitle} onChange={e=>setNewPostTitle(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Content:</label>
                <textarea value={newPostContent} onChange={e=>setNewPostContent(e.target.value)} />
              </div>
              <div className="form-group">
  <label>Attach Recording (optional):</label>
  <div className="recording-select-row">
    <select
      value={selectedRecordingId ?? ""}
      onChange={e => setSelectedRecordingId(e.target.value || null)}
    >
      <option value="">No recording</option>
      {userRecordings.map(r => (
        <option key={r.id} value={r.id}>
          {r.title || `Recording #${r.id}`}
        </option>
      ))}
    </select>
    
    <button
  type="button"
  className="play-recording-btn"
  onClick={() => {
    if (!selectedRecordingId) return;

    const recObj = userRecordings.find(r => r.id === Number(selectedRecordingId));
    if (!recObj) return;

    playRecordingFromPost(recObj.recording);
  }}
  disabled={!selectedRecordingId}
>
  ▶ Preview
</button>



    <button
      type="button"
      className="refresh-recordings-btn"
      onClick={fetchUserRecordings}
    >
      ⟳
    </button>
  </div>
</div>

              <div className="form-group">
                <label>Tags:</label>
                <div className="tag-selection">
                  {animalTags.concat(soundTags).map(tag => (
                    <span key={tag} className={`tag ${newPostTags.includes(tag)?"active":""}`} onClick={() => setNewPostTags(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag])}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="popup-footer">
              <button className="cancel-btn" onClick={()=>setShowNewPostPopup(false)}>Cancel</button>
              <button className="submit-btn" onClick={handleSubmitPost} disabled={!newPostTitle.trim() || !newPostContent.trim()}>Create Post</button>
            </div>
          </div>
        </div>
      )}

      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
    </div>
  );
}
