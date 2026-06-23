export default function Login() {
  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">Tokkicorp mailbox</h1>

        <p className="description">
          This page will allow you to login to your existing mailbox. Please enter the
          required information below.
        </p>

        <form className="register-form">
          <input type="text" placeholder="Email Address" className="input" />
          <input type="password" placeholder="Password" className="input" />

          <button type="submit" className="button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}