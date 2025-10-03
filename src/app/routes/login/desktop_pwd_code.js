import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./desktop_pwd_code.css";

export default function PwdCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleVerify = async () => {
    try {
      // Get the auth_token from cookies
      const authToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="))
        ?.split("=")[1];

      if (!authToken) {
        alert("Authentication token not found.");
        return;
      }

      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/isabelTest/php/reset_password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verification_code: code,
            auth_token: authToken,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        navigate("/reset-password");
      } else {
        alert(data.message || "Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      alert("An error occurred. Please try again later.");
    }
  };

  return (
    <div className="changepwd-container">
      <div className="changepwd-card">
        <div className="changepwd-logo">🐾</div>
        <h1 className="changepwd-title">ANIMALBAND</h1>
        <h2 className="changepwd-subtitle">Verify Account</h2>
        <input
          type="text"
          placeholder="Enter the Verification Code"
          className="changepwd-input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <p className="changepwd-info">
          A Verification Code has been sent to <br />
          the email associated with your account.
        </p>
        <button className="changepwd-button" onClick={handleVerify}>
          Verify Account to Reset Password
        </button>
      </div>
    </div>
  );
}
