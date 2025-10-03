import React, { useState } from "react";
import ".desktop_pwd_reset.css";

export default function ResetPwd() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === confirmPassword) {
      console.log("Password reset successfully");
      // Implement password reset logic here
    } else {
      console.log("Passwords do not match");
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="header">
          <div className="paw-icon">🐾</div>
          <h1>ANIMALBAND</h1>
          <h2>Reset Password</h2>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Create a New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="reset-btn">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}
