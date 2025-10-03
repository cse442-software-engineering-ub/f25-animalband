import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

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
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/isabelTest/php/login.php",
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
    <div className="login-page">
      <h2>Login</h2>
      <form>
        <label>
          Email
          <input type="text" name="email" />
        </label>
        <br />
        <label>
          Password
          <input type="password" name="password" />
        </label>
        <button type="button" onClick={handleLogin}>
          Login
        </button>
      </form>
      <Link to="/password-code">Forgot Password?</Link>
      Don't have an account? <Link to="/register">Register</Link>
    </div>
  );
}