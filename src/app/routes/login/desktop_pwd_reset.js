import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./desktop_pwd_reset.css";

export default function ResetPwd() {
    const navigate=useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = async () => {
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const authToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1];

    if (!authToken) {
      alert("Authentication token not found.");
      return;
    }

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/isabelTest/php/update-password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_password: password,
            auth_token: authToken,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect if desired
        navigate("/");
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      alert("An error occurred. Please try again.");
    }
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
          Reset Password
        </button>
      </div>
    </div>
  );
}
