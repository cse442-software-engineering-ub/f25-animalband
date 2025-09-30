export default function Register() {
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
          <button type="submit">Sign Up</button>
        </form>
      </div>
    );
}
