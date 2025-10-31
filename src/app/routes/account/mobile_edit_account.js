import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./mobile_edit_account.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/shabad/php";

export default function MobileEditAccount() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form states
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [msg, setMsg] = useState(null);

    // Password visibility states
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Mobile navigation states
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);

    // Get User data
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    `${PHP_URL}/getUser.php`,
                    { credentials: "include" }
                );
                const text = await res.text();
                console.log("Raw response:", text);
                const data = JSON.parse(text);

                if (!data.loggedIn) {
                    navigate("/login");
                    return;
                }
                setUser(data);
                setUsername(data.username || "");
                setEmail(data.email || "");
            } catch (e) {
                console.error(e);
                setMsg({ type: "error", text: "Failed to load user." });
            } finally {
                setLoading(false);
            }
        })();
    }, [navigate]);

    // Sidebar handlers
    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
    const closeSidebar = () => setSidebarOpen(false);

    // Submission
    const onSubmit = async (e) => {
        e.preventDefault();
        setMsg(null);

        if (!currentPwd) {
            setMsg({ type: "error", text: "Please enter your current password." });
            return;
        }
        if (newPwd && newPwd !== confirmPwd) {
            setMsg({ type: "error", text: "New passwords do not match." });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`${PHP_URL}/updateAccount.php`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: username.trim(),
                    currentPassword: currentPwd,
                    newPassword: newPwd || null,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ type: "ok", text: "Profile updated!" });
                setCurrentPwd("");
                setNewPwd("");
                setConfirmPwd("");

                // Update user data
                setUser(prev => ({ ...prev, username: username.trim() }));
            } else {
                setMsg({ type: "error", text: data.message || "Update failed." });
            }
        } catch (e) {
            console.error(e);
            setMsg({ type: "error", text: "Network error." });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <p className="mea-loading">Loading…</p>;

    return (
        <div className="mea-page">
            {/* Mobile Header */}
            <header className="mea-header">
                <div className="mea-logo-section" onClick={() => navigate("/")}>
                    <span className="material-symbols-outlined mea-paw-icon">pets</span>
                    <span className="mea-site-title">ANIMALBAND</span>
                </div>
                <div className="mea-header-buttons">
                    {user && user.profilePic ? (
                        <img
                            src={`https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/shabad/php/${user.profilePic}`}
                            alt="Profile"
                            className="mea-profile-pic"
                            onClick={() => navigate("/account")}
                        />
                    ) : (
                        <button
                            className="mea-menu-toggle"
                            onClick={toggleSidebar}
                        >
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Mobile Sidebar */}
            <div className={`mea-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="mea-sidebar-header">
                    <h3>Menu</h3>
                    <button className="mea-sidebar-close" onClick={closeSidebar}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <ul>
                    <li>
                        <button onClick={() => { navigate("/account"); closeSidebar(); }}>
                            My Profile
                        </button>
                    </li>
                    <li>
                        <button onClick={() => { navigate("/stage"); closeSidebar(); }}>
                            Back to Stage
                        </button>
                    </li>
                    <li>
                        <button onClick={() => {
                            // Add logout functionality here
                            console.log("Logout");
                            navigate("/login");
                        }}>
                            Logout
                        </button>
                    </li>
                </ul>
            </div>

            {/* Overlay */}
            <div
                className={`mea-overlay ${sidebarOpen ? 'active' : ''}`}
                onClick={closeSidebar}
            />

            {/* Main Content */}
            <div className="mea-content">
                <h1 className="mea-title">Edit Account</h1>
                <p className="mea-subtitle">Update your display name and password.</p>

                {msg && (
                    <div className={`mea-alert ${msg.type === "ok" ? "mea-ok" : "mea-err"}`}>
                        {msg.text}
                    </div>
                )}

                <form onSubmit={onSubmit} className="mea-form">
                    <label htmlFor="mea-email">Email (read-only)</label>
                    <input id="mea-email" value={email} readOnly />

                    <label htmlFor="mea-username">Display name (required)</label>
                    <input
                        id="mea-username"
                        name="name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your name"
                        required
                    />

                    <hr className="mea-sep" />

                    {/* Current Password */}
                    <label htmlFor="mea-current">Current password (required)</label>
                    <div className="mea-password-field">
                        <input
                            id="mea-current"
                            type={showCurrent ? "text" : "password"}
                            name="current-password"
                            autoComplete="current-password"
                            value={currentPwd}
                            onChange={(e) => setCurrentPwd(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="mea-eye-btn"
                            onClick={() => setShowCurrent(!showCurrent)}
                            aria-label={showCurrent ? "Hide password" : "Show password"}
                        >
                            <span className="material-symbols-outlined">
                                {showCurrent ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>

                    {/* New Password */}
                    <label htmlFor="mea-new">New password (optional)</label>
                    <div className="mea-password-field">
                        <input
                            id="mea-new"
                            type={showNew ? "text" : "password"}
                            name="new-password"
                            autoComplete="new-password"
                            value={newPwd}
                            onChange={(e) => setNewPwd(e.target.value)}
                        />
                        <button
                            type="button"
                            className="mea-eye-btn"
                            onClick={() => setShowNew(!showNew)}
                            aria-label={showNew ? "Hide password" : "Show password"}
                        >
                            <span className="material-symbols-outlined">
                                {showNew ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>

                    {/* Confirm Password */}
                    <label htmlFor="mea-confirm">Confirm new password</label>
                    <div className="mea-password-field">
                        <input
                            id="mea-confirm"
                            type={showConfirm ? "text" : "password"}
                            name="new-password"
                            autoComplete="new-password"
                            value={confirmPwd}
                            onChange={(e) => setConfirmPwd(e.target.value)}
                        />
                        <button
                            type="button"
                            className="mea-eye-btn"
                            onClick={() => setShowConfirm(!showConfirm)}
                            aria-label={showConfirm ? "Hide password" : "Show password"}
                        >
                            <span className="material-symbols-outlined">
                                {showConfirm ? "visibility_off" : "visibility"}
                            </span>
                        </button>
                    </div>

                    <div className="mea-actions">
                        <button type="submit" className="mea-btn mea-btn-solid" disabled={submitting}>
                            {submitting ? "Saving…" : "Save changes"}
                        </button>
                        <button type="button" className="mea-btn" onClick={() => navigate(-1)}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-bottom-nav">
                <Link to="/stage" className="mobile-nav-item">
                    <span className="material-symbols-outlined mobile-nav-icon">piano</span>
                    <span>Stage</span>
                </Link>
                <Link to="/looping" className="mobile-nav-item">
                    <span className="material-symbols-outlined mobile-nav-icon">instant_mix</span>
                    <span>Looping</span>
                </Link>
                <Link to="/forum" className="mobile-nav-item">
                    <span className="material-symbols-outlined mobile-nav-icon">chat</span>
                    <span>Forum</span>
                </Link>
                <Link to="/account" className="mobile-nav-item active">
                    <span className="material-symbols-outlined mobile-nav-icon">person</span>
                    <span>Profile</span>
                </Link>
            </nav>

            {/* Material Icons Font */}
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                rel="stylesheet"
            />
        </div>
    );
}