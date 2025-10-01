import { useNavigate, Link } from "react-router-dom";
import "./desktop_login.css";

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const form = e.target.form;
    const email = form["email"].value.trim();
    const password = form["password"].value;

    const postData = { email, password };

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/login.php",
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
        navigate("/login");
      }
    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo">
          <div className="paw-icon">🐾</div>
          <h1>ANIMALBAND</h1>
          <h2 style={{ color: "#2e8b57" }}>Login</h2>
        </div>
        <form>
          <input type="text" name="email" placeholder="Email" />
          <input type="password" name="password" placeholder="Password" />
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember Me
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forget Password?
            </Link>
          </div>

          <button type="button" onClick={handleLogin}>
            Login
          </button>
        </form>
        <p className="register-link">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
