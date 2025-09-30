import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const handleRegister = async (e) => {
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

      if (!response.ok) {
        throw new Error(`Request failed. Status ${response.status}`);
      }

      navigate("/");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div className="login-page">
      <h2>Register</h2>
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
        <button type="button" onClick={handleRegister}>
          Register
        </button>
      </form>
    </div>
  );
}