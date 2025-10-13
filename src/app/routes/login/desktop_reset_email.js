import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./reset_email.css";

export default function ResetEmail() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/fixPwdReset/verifyEmail.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        navigate("/forgot-password");
      } else {
        setError("Invalid email");
      }
    } catch (err) {
      console.error("Error verifying email:", err);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="reset-email-container">
      <div className="reset-email-box">
        <span className="material-symbols-outlined paw-icon">pets</span>
        <h2 className="title">ANIMALBAND</h2>
        <p className="subtitle">Account Email</p>

        <form onSubmit={handleSubmit} className="email-form">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <p className="instructions">
            Enter the email address associated with your account.
          </p>

          {error && <p className="error-text">{error}</p>}

          <button type="submit">Get Verification Code</button>
        </form>
      </div>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}