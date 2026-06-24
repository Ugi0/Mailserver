import { useState } from "react";
import "./Register.css";
import { createAccount, validateRegistryCode } from "../helpers/register";
import CredentialsPage from "../components/CredentialsPage";

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
