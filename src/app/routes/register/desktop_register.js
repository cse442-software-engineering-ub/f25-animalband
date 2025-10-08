import { useNavigate, Link } from "react-router-dom";
import "./desktop_register.css";

export default function Register() {
  const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        const form = e.target;
        const username = form["username"].value.trim();
        const email = form["email"].value.trim();
        const password = form["password"].value;
        const passwordConf = form["password-conf"].value;
        const profilePic = form["profilePic"].files[0];

        if (password !== passwordConf) {
            alert("Passwords do not match.");
            return;
        }

        const formData = new FormData();
        formData.append("username", username);
        formData.append("email", email);
        formData.append("password", password);
        if (profilePic) {
            formData.append("profilePic", profilePic);
        }

        try {
            const response = await fetch(
                "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/register.php",
                {
                    method: "POST",
                    body: formData,
                    credentials: "include",
                }
            );

            if (!response.ok) {
                throw new Error(`Request failed. Status ${response.status}`);
            }

            navigate("/");
        } catch (err) {
            console.error(err);
            alert("Registration failed");
        }
    };

  return (
    <div className="register-page">
      <div className="logo">
        <span className="material-symbols-outlined paw-icon">pets</span>
        <h1>ANIMALBAND</h1>
        <h2>Register</h2>
      </div>

      <form onSubmit={handleRegister}>
        <label>
          Name
          <input type="text" name="username" />
        </label>
        <label>
          Email
          <input type="text" name="email" />
        </label>
        <label>
          Password
          <input type="password" name="password" />
        </label>
        <label>
          Confirm Password
          <input type="password" name="password-conf" />
        </label>
        <label>
          Profile Picture
          <input type="file" name="profilePic" accept="image/*" />
        </label>
        <button type="submit">Register</button>
      </form>

      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
        rel="stylesheet"
      />
    </div>
  );
}

