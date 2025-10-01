import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Register() {
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();

    const form = e.target.form;
    const username = form["username"].value.trim();
    const email = form["email"].value.trim();
    const password = form["password"].value;

    if (!username || !email || !password) {
      setError("All fields are required.");
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

      const data = await response.json();

      if (data.success) {
        navigate("/"); // Auto-login after registration
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Network error. Try again later.");
    }
  };

  return (
    <div className="register-page">
      <h2>Register</h2>
      <form>
        <label>
          Username
          <input type="text" name="username" />
        </label>
        <br />
        <label>
          Email
          <input type="email" name="email" />
        </label>
        <br />
        <label>
          Password
          <input type="password" name="password" />
        </label>
        <br />
        <button type="button" onClick={handleRegister}>
          Register
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
