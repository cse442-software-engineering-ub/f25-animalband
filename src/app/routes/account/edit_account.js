// src/app/routes/account/edit_account.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./edit_account.css";

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

    // Get User
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(
                    "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/getUser.php",
                    { credentials: "include" }
                );
                const data = await res.json();

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
            const res = await fetch("/updateAccount.php", {
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

                <label htmlFor="ea-username">Display name</label>
                <input
                    id="ea-username"
                    name="name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your name"
                    required
                />

                <hr className="ea-sep" />

                <label htmlFor="ea-current">Current password (required)</label>
                <input
                    id="ea-current"
                    type="password"
                    name="current-password"
                    autoComplete="current-password"
                    value={currentPwd}
                    onChange={(e) => setCurrentPwd(e.target.value)}
                    required
                />

                <label htmlFor="ea-new">New password (optional)</label>
                <input
                    id="ea-new"
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    minLength={8}
                />

                <label htmlFor="ea-confirm">Confirm new password</label>
                <input
                    id="ea-confirm"
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
                    value={confirmPwd}
                    onChange={(e) => setConfirmPwd(e.target.value)}
                    minLength={8}
                />

                <div className="ea-actions">
                    <button type="submit" className="btn btn-solid" disabled={submitting}>
                        {submitting ? "Saving…" : "Save changes"}
                    </button>
                    <button type="button" className="btn" onClick={() => navigate(-1)}>
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
