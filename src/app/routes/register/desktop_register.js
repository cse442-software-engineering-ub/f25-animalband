import { useNavigate, Link } from "react-router-dom";
import "./desktop_register.css"; // New CSS file

export default function Register() {
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const form = e.target.form;
    const username = form["username"].value.trim();
    const email = form["email"].value.trim();
    const password = form["password"].value;
    const passwordConf = form["password-conf"].value;

    if (password !== passwordConf) {
      alert("Passwords do not match.");
      return;
    }

    const postData = { username, email, password };

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/register.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`Request failed. Status ${response.status}`);
      }

      navigate("/");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="logo">
          <span className="material-symbols-outlined paw-icon">pets</span>
          <h1>ANIMALBAND</h1>
          <h2 style={{ color: "#2e8b57" }}>Register</h2>
        </div>
        <form>
          <input type="text" name="username" placeholder="Name" />
          <input type="text" name="email" placeholder="Email" />
          <input
            type="password"
            name="password"
            placeholder="Create a Password"
          />
          <input
            type="password"
            name="password-conf"
            placeholder="Confirm Password"
          />
          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              Remember Me
            </label>
          </div>
          <button type="button" onClick={handleRegister}>
            Register
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </div>
    </div>
  );
}