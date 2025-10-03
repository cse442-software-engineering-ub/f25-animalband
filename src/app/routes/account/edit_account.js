// src/app/routes/account/edit_account.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./edit_account.css";

const PHP_URL = "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php";

export default function EditAccount() {

    // States and such
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [msg, setMsg] = useState(null);

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Get User
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
                // const data = await res.json();

                // If not logged in redirect to login page
                if (!data.loggedIn) {
                    navigate("/login");
                    return;
                }
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

    if (loading) return <p className="ea-loading">Loading…</p>;

    return (
        <div className="ea-wrap">
            <h1 className="ea-title">Edit Account</h1>
            <p className="ea-subtitle">Update your display name and password.</p>

            {msg && (
                <div className={`ea-alert ${msg.type === "ok" ? "ea-ok" : "ea-err"}`}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={onSubmit} className="ea-form">
                <label htmlFor="ea-email">Email (read-only)</label>
                <input id="ea-email" value={email} readOnly />

                <label htmlFor="ea-username">Display name (required)</label>
                <input
                    id="ea-username"
                    name="name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    required
                />

                <hr className="ea-sep" />

                {/* Current Password */}
                <label htmlFor="ea-current">Current password (required)</label>
                <div className="ea-password-field">
                    <input
                        id="ea-current"
                        type={showCurrent ? "text" : "password"}
                        name="current-password"
                        autoComplete="current-password"
                        value={currentPwd}
                        onChange={(e) => setCurrentPwd(e.target.value)}
                        required
                    />
                    <button
                        type="button"
                        className="ea-eye-btn"
                        onClick={() => setShowCurrent(!showCurrent)}
                        aria-label={showCurrent ? "Hide password" : "Show password"}
                    >
                        <span className="material-symbols-outlined">
                            {showCurrent ? "visibility_off" : "visibility"}
                        </span>
                    </button>
                </div>

                {/* New Password */}
                <label htmlFor="ea-new">New password (optional)</label>
                <div className="ea-password-field">

                    <input
                        id="ea-new"
                        type={showNew ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                    />
                    <button
                        type="button"
                        className="ea-eye-btn"
                        onClick={() => setShowNew(!showNew)}
                        aria-label={showNew ? "Hide password" : "Show password"}
                    >
                        <span className="material-symbols-outlined">
                            {showNew ? "visibility_off" : "visibility"}
                        </span>
                    </button>
                </div>


                {/* Confirm Password */}
                <label htmlFor="ea-confirm">Confirm new password</label>
                <div className="ea-password-field">

                    <input
                        id="ea-confirm"
                        type={showConfirm ? "text" : "password"}
                        name="new-password"
                        autoComplete="new-password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                    />
                    <button
                        type="button"
                        className="ea-eye-btn"
                        onClick={() => setShowConfirm(!showConfirm)}
                        aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                        <span className="material-symbols-outlined">
                            {showConfirm ? "visibility_off" : "visibility"}
                        </span>
                    </button>
                </div>

                <div className="ea-actions">
                    <button type="submit" className="btn btn-solid" disabled={submitting}>
                        {submitting ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" className="btn" onClick={() => navigate(-1)}>
                        Return
                    </button>
                </div>
            </form>

            {/* Material Icons Font */}
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
                rel="stylesheet"
            />
        </div>
    );
}
