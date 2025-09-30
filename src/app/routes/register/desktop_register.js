export default function Register() {
    const handleRegister = async (e) => {
      e.preventDefault();

      const form = e.target.form;
      const username = form.username.value;
      const email = form.email.value;
      const password = form.password.value;
      const passwordConf = form["password-conf"].value;

      if (password !== passwordConf) {
        alert("Passwords do not match.");
        return;
      }

      const postData = { username, email, password };

      try {
        // Try localhost first
        const response = await fetch(
          "http://localhost:3000/CSE442/2025-Fall/cse-442h/register.php",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(postData),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        alert(data.message || "Registration successful!");
      } catch (error) {
        // If localhost failed, silently POST to test server instead
        try {
          const fallbackResponse = await fetch(
            "https://aptitude.cse.buffalo.edu/CSE442/2025-Fall/cse-442h/register.php",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(postData),
            }
          );

          if (!fallbackResponse.ok) {
            throw new Error(
              `Fallback HTTP error! status: ${fallbackResponse.status}`
            );
          }

          const fallbackData = await fallbackResponse.json();
          alert(fallbackData.message || "Registration successful (fallback)!");
        } catch (fallbackError) {
          console.error("Both fetch attempts failed:", fallbackError);
          alert("Failed to register on both local and test server.");
        }
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
