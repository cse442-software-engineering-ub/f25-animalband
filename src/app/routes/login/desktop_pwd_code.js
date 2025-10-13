import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./desktop_pwd_code.css";

export default function PwdCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false); // for displaying inline error

  const handleVerify = async () => {
    try {
      setError(false); // clear error before retrying

      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/isabelTest/php/reset-password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            verification_code: code,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        navigate("/reset-password");
      } else {
        setError(true); // show error message
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(true); // show error message on exception
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
        {error && <p className="changepwd-error">Invalid verification code</p>}
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
