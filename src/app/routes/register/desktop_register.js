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
    const profilePic = form["profile-pic"].files[0]; // <-- new

    if (password !== passwordConf) {
      alert("Passwords do not match.");
      return;
    }

    // Instead of JSON, use FormData
    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (profilePic) {
      formData.append("profile_pic", profilePic); // key must match PHP side
    }

    try {
      const response = await fetch(
        "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/php/register.php",
        {
          method: "POST",
          body: formData, // no need for Content-Type, browser sets boundary
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
        <br />
        <label>
          Profile Picture
          <input type="file" name="profile-pic" accept="image/*" />
        </label>
        <br />
        <button type="button" onClick={handleRegister}>
          Register
        </button>
      </form>
    </div>
  );
}
