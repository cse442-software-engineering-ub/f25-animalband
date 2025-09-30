import { useNavigate } from "react-router-dom";

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
        const response = await fetch("https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/register.php", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(postData),
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error(`Request failed. Status ${response.status}`);
        }

        // const result = await response.json();

        navigate("/");
      } catch {
        alert("Registration failed");
      }
    };

    return (
      <div className="register-page">
        <h2>Register</h2>
        <form>
          <label>
            Name
            <input type="text" name="username" />
          </label>
          <br />
          <label>
            Email
            <input type="text" name="email" />
          </label>
          <br />
          <label>
            Password
            <input type="password" name="password" />
          </label>
          <br />
          <label>
            Confirm Password
            <input type="password" name="password-conf" />
          </label>
          <button type="button" onClick={handleRegister}>Register</button>
        </form>
      </div>
    );
}
