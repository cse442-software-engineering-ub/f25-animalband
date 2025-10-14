import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./desktop_pwd_reset.css";

export default function ResetPwd() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/fixPwdReset/php/update-password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ new_password: password }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        navigate("/login");
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="resetpwd-page">
      <div className="card">
        <div className="logo">🐾</div>
        <h1 className="title">ANIMALBAND</h1>
        <h2 className="subtitle">Reset Password</h2>

        <input
          type="password"
          placeholder="Create a New Password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="error">{error}</p>}

        <button className="button" onClick={handleReset}>
          Reset Password
        </button>
      </div>
    </div>
  );
}