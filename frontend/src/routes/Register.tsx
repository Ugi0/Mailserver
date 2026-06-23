import { useState } from "react";
import "./Register.css";
import { createAccount, validateLoginCredentials, validateRegistryCode } from "../helpers/register";

export default function Register() {
  const [registrationCode, setRegistrationCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);

  const setCredentials = (credentials: { username: string; password: string }) => {
    setUsername(credentials.username);
    setPassword(credentials.password);
  };

  if (!registrationCode) {
    return <CodePage setValidatedCode={setRegistrationCode} />;
  }

  if (!username || !password) {
    return <CredentialsPage setCredentials={setCredentials} />;
  }

  if (registrationCode && username && password && !accountCreated) {
    if (createAccount(username, password, registrationCode)) {
      setAccountCreated(true);
    } else {
      alert("Account creation failed. Please try again.");
    }
  }

  if (accountCreated) {
    redirectToInstructions();
  }

  return (
    <div>
      Loading...
    </div>
  );
}

function CredentialsPage({ setCredentials }: { setCredentials: (credentials: { username: string; password: string }) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">Tokkicorp Mailbox</h1>

        <p className="description">
          Your registration code has been validated. Please enter your desired username and password to complete the registration process.
        </p>

        <form className="register-form">
          <div className="input-group">
            <input
              id="email"
              type="text"
              placeholder="username"
              className="input username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span className="input-suffix">@tokkicorp.com</span>
          </div>
          <input
            id="password"
            type="password"
            placeholder="Enter Password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="button" onClick={() => {
            const validationMessage = validateLoginCredentials(username, password);

            if (validationMessage === "") {
              setCredentials({
                username: `${username}@tokkicorp.com`,
                password
              });
            } else {
              alert(validationMessage);
            }
          }}>
            Register
          </button>
        </form>
      </div>
    </div>
  );
}

function CodePage({ setValidatedCode }: { setValidatedCode: (code: string) => void }) {
  const [registrationCode, setRegistrationCode] = useState("");

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">Tokkicorp Mailbox</h1>

        <p className="description">
          Welcome to Tokkicorp Mailbox. To register for a new mailbox, you will need a valid registration code. 
        </p>

        <p className="instructions">
          Enter your registration code below. If you don't have one, contact
          <a href="mailto:ugi@tokkicorp.com"> ugi@tokkicorp.com</a>.
        </p>

        <form className="register-form">
          <input
            id="registration-code"
            type="text"
            placeholder="Enter Registration Code"
            className="input"
            value={registrationCode}
            onChange={(e) => setRegistrationCode(e.target.value)}
          />

          <button type="submit" className="button" onClick={() => {
            if (validateRegistryCode(registrationCode)) {
              setValidatedCode(registrationCode);
            } else {
              alert("Invalid registration code. Please try again.");
            }
          }}>
            Register
          </button>
        </form>
      </div>
    </div>
    )
  };

function redirectToInstructions() {
  if (typeof window === "undefined") return;

  const targetPath = "/instructions";
  if (window.location.pathname !== targetPath) {
    window.location.assign(targetPath);
  }
}
