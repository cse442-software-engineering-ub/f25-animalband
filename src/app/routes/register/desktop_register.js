import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import "./desktop_register.css";

export default function Register() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});

    const handleRegister = async (e) => {
        e.preventDefault();

        const form = e.target;
        const username = form["username"].value.trim();
        const email = form["email"].value.trim();
        const password = form["password"].value;
        const passwordConf = form["password-conf"].value;
        const profilePic = form["profilePic"].files[0];

        // Reset errors
        const newErrors = {};

        // Validate empty fields
        if (!username) newErrors.username = true;
        if (!email) newErrors.email = true;
        if (!password) newErrors.password = true;
        if (!passwordConf) newErrors.passwordConf = true;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && !emailRegex.test(email)) {
            newErrors.email = true;
            alert("Please enter a valid email address.");
            setErrors(newErrors);
            return;
        }

        // Check if there are any errors
        if (Object.keys(newErrors).length > 0) {
            alert("Please fill in all required fields.");
            setErrors(newErrors);
            return;
        }

        if (password !== passwordConf) {
            alert("Passwords do not match.");
            setErrors({ password: true, passwordConf: true });
            return;
        }

        setErrors({});

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
          <input 
            type="text" 
            name="username" 
            placeholder="Name"
            style={errors.username ? { border: '2px solid red' } : {}}
          />
        </label>
        <label>
          Email
          <input 
            type="text" 
            name="email" 
            placeholder="Email"
            style={errors.email ? { border: '2px solid red' } : {}}
          />
        </label>
        <label>
          Password
          <input 
            type="password" 
            name="password" 
            placeholder="Create a Password"
            style={errors.password ? { border: '2px solid red' } : {}}
          />
        </label>
        <label>
          Confirm Password
          <input 
            type="password" 
            name="password-conf" 
            placeholder="Confirm Password"
            style={errors.passwordConf ? { border: '2px solid red' } : {}}
          />
        </label>
        <label>
          Profile Picture
          <input type="file" name="profilePic" accept="image/*" className="file-input" />
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

