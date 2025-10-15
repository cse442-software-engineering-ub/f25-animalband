import { useNavigate } from "react-router-dom";
import { useState } from "react";
import "./desktop_pwd_code.css";

export default function PwdCode() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const handleVerify = async () => {
    setError(false);

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/reset-password.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ verification_code: code }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        navigate("/reset-password");
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(true);
    }
  };

  return (
    <div className="pwd-code-page">
      <div className="card">
        <div className="logo">🐾</div>
        <h1 className="title">ANIMALBAND</h1>
        <h2 className="subtitle">Verify Account</h2>

        <input
          type="text"
          placeholder="Enter the Verification Code"
          className="input"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        {error && <p className="error">Invalid verification code</p>}

        <p className="info">
          A Verification Code has been sent to <br />
          the email associated with your account.
        </p>

        <button className="button" onClick={handleVerify}>
          Verify Account to Reset Password
        </button>
      </div>
    </div>
  );
}