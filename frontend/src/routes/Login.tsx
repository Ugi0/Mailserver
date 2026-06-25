import { useEffect, useState } from "react";
import { checkCredentials } from "../helpers/login";
import "./Register.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const res = await fetch("/api/users/me", {
        credentials: "include",
      });

      if (res.ok) {
        window.location.href = "/manage";
      } else {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  if (loading) return null;

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">Tokkicorp mailbox</h1>

        <p className="description">
          This page will allow you to login to your existing mailbox. Please enter the
          required information below.
        </p>

        <form
          className="register-form"
          onSubmit={async (e) => {
            e.preventDefault();

            if (await checkCredentials(email, password)) {
              console.log("Login successful");
              window.location.href = "/manage";
            } else {
              alert("Invalid credentials. Please try again.");
            }
          }}
        >
          <input
            type="text"
            placeholder="Email Address"
            className="input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="button">
            Login
          </button>
        </form>

        <p
          className="secondary-link"
          onClick={() => {
            window.location.href = "/register"
          }}
        >
          Don't have an account? <span>Sign up</span>
        </p>

      </div>
    </div>
  );
}