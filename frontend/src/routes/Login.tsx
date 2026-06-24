import { useState } from "react";
import { checkCredentials } from "../helpers/login";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        onSubmit={(e) => {
          e.preventDefault(); // 🚨 stops page reload

          if (checkCredentials(email, password)) {
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
      </div>
    </div>
  );
}