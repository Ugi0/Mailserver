import { useState } from "react";
import { passwordRules } from "../helpers/passwordRules";
import "./CredentialsPage.css";

export default function CredentialsPage({
  setCredentials,
}: {
  setCredentials: (credentials: {
    username: string;
    password: string;
  }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // 🔥 Tracks how many rules have been revealed
  const [revealedCount, setRevealedCount] = useState(0);

  // 🔥 Stores last evaluation (only updates when button pressed)
  const [evaluatedRules, setEvaluatedRules] = useState<
    { message: string; passed: boolean, subtext?: string }[]
  >([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Evaluate rules ONLY here
    const results = passwordRules.map((rule) => ({
      message: rule.message,
      passed: rule.check(password),
      subtext: rule.subtext,
    }));

    setEvaluatedRules(results);

    // 🔥 Progressive reveal
    let newRevealCount = revealedCount;

    for (let i = 0; i < results.length; i++) {
      if (i >= revealedCount) {
        newRevealCount = i + 1;
      }
      if (!results[i].passed) break;
    }

    setRevealedCount(newRevealCount);

    const allPassed = results.every((r) => r.passed);

    if (allPassed) {
      setCredentials({
        username: `${username}@tokkicorp.com`,
        password,
      });
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="title">Tokkicorp Mailbox</h1>

        <p className="description">
          Your registration code has been validated. Please enter your desired
          username and password to complete the registration process.
        </p>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              id="username"
              type="text"
              placeholder="username"
              className="input username-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <span className="input-suffix">@tokkicorp.com</span>
          </div>

          {/* 🔥 Password field + sliding panel wrapper */}
          <div className="password-section">
            <input
              id="password"
              type="password"
              placeholder="Enter Password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* 🔥 Sliding rule panel */}
            <div
              className={`rules-panel ${
                revealedCount > 0 ? "open" : ""
              }`}
            >
              {evaluatedRules
                .slice(0, revealedCount)
                .slice()
                .reverse()
                .map((rule, index) => (
                    <div
                        key={index}
                        className={`rule-card ${rule.passed ? "passed" : "failed"}`}
                        >
                        <div className="rule-text">
                            <span className="icon">
                            {rule.passed ? "✅" : "❌"}
                            </span>

                            <div>
                            <div className="rule-message">{rule.message}</div>

                            {rule.subtext && (
                                <div className="rule-subtext">{rule.subtext}</div>
                            )}
                            </div>
                        </div>
                    </div>
                ))}

            </div>
          </div>

          <button type="submit" className="button">
            Register
          </button>
        </form>
      </div>
    </div>
  );
}