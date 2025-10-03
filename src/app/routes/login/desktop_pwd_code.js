import { useNavigate } from "react-router-dom";
import "./desktop_change_pwd.css"; // Assuming you put the CSS in the same folder

export default function PwdCode() {
  const navigate = useNavigate();

  const handleVerify = () => {
    //TODO: new path for reset password
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
