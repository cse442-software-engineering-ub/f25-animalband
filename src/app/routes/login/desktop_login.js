import { useNavigate, Link } from "react-router-dom";
import CustomModal from "../../components/CustomModal";
import useCustomModal from "../../components/useCustomModal";
import "./desktop_login.css";

export default function Login() {
  const navigate = useNavigate();
  const { modalState, showModal, closeModal } = useCustomModal();

  const handleLogin = async (e) => {
    e.preventDefault();

    const form = e.target.form;
    const email = form["email"].value.trim();
    const password = form["password"].value;

    const postData = { email, password };

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/fixPwdReset/php/login.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
          credentials: "include",
        }
      );

      const data = await response.json();

      if (data.success) {
        navigate("/");
      } else {
        showModal("Login failed. Please check your credentials.", "error");
      }
    } catch {
      showModal("Login failed. Please try again.", "error");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1>ANIMALBAND</h1>
          <h2>Login</h2>
        </div>
        <form>
          <input type="text" name="email" placeholder="Email" />
          <input type="password" name="password" placeholder="Password" />

          <p className="forgot-link-container">
            <Link to="/account-email" className="forgot-link">
              Forgot Password?
            </Link>
          </p>

          <button type="button" onClick={handleLogin}>
            Login
          </button>
        </form>
        <p className="register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>

      <CustomModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        message={modalState.message}
        type={modalState.type}
        title={modalState.title}
      />

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}