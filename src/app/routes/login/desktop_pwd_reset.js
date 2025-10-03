import { useState } from "react";
import "./reset_pwd.css";

export default function ResetPwd() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // TODO: Send the password to the backend for updating
    alert("Password reset successfully!");
  };

  return (
    <div className="resetpwd-container">
      <div className="resetpwd-card">
        <div className="resetpwd-logo">🐾</div>
        <h1 className="resetpwd-title">ANIMALBAND</h1>
        <h2 className="resetpwd-subtitle">Reset Password</h2>
        <input
          type="password"
          placeholder="Create a New Password"
          className="resetpwd-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="resetpwd-input"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button className="resetpwd-button" onClick={handleReset}>
