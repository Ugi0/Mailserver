import { useState } from "react";
import "./Manage.css";

export default function EmailSettingsView() {
  const userEmail = "user@domain.com";

  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwarding, setForwarding] = useState("");
  const [aliasInput, setAliasInput] = useState("");
  const [aliases, setAliases] = useState<string[]>([]);

  const [rules] = useState(["Move 'invoice' → Finance"]);
  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationMsg, setVacationMsg] = useState("");

  const addAlias = () => {
    if (aliasInput.trim()) {
      setAliases([...aliases, aliasInput]);
      setAliasInput("");
    }
  };

  const removeAlias = (index: number) => {
    setAliases(aliases.filter((_, i) => i !== index));
  };

  return (
    <div className="container">

      {/* Header */}
      <div className="header">
        <button onClick={() => (window.location.href = "/instructions")}>
          ← Back to instructions
        </button>
        <h1>Email Settings</h1>
      </div>

      <div className="email-settings">

        {/* Identity (read-only) */}
        <div className="card">
          <div className="card-content">
            <h2>
              Identity 
            </h2>
            <p className="readonly">{userEmail}</p>
          </div>
        </div>

        {/* Aliases */}
        <div className="card">
          <div className="card-content">
            <h2>
              Aliases
              <span className="tooltip">
                ?
                <span className="tooltip-text">
                  Aliases let you receive emails sent to different addresses in this mailbox.
                </span>
              </span>
            </h2>

            <div className="row">
              <input
                className="input"
                placeholder="alias@domain.com"
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
              />
              <button className="btn" onClick={addAlias}>Add</button>
            </div>

            {/* Alias list */}
            <ul className="list">
              {aliases.map((a, i) => (
                <li key={i}>
                  {a}
                  <button onClick={() => removeAlias(i)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Forwarding */}
        <div className="card">
          <div className="card-content">
            <h2>
                Forwarding 
                <span className="tooltip">
                  ?
                  <span className="tooltip-text">
                    Automatically send incoming emails to another address.
                  </span>
                </span>
            </h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={forwardingEnabled}
                onChange={() => setForwardingEnabled(!forwardingEnabled)}
              />
              Enable forwarding
            </label>

            {forwardingEnabled && (
              <input
                className="input"
                placeholder="Forward to email"
                value={forwarding}
                onChange={(e) => setForwarding(e.target.value)}
              />
              )}
              <button className="btn">Save</button>
          </div>
        </div>

        {/* Filters / Rules */}
        <div className="card">
          <div className="card-content">
            <h2>
              Rules 
              <span className="tooltip">
                ?
                <span className="tooltip-text">
                  Automatically organize, move, or delete incoming emails.
                  <br/>
                  eg. "Move emails containing 'invoice' to the Finance folder"
                </span>
              </span>
            </h2>

            <ul className="list">
              {rules.map((rule, i) => (
                <li key={i}>{rule}</li>
              ))}
            </ul>

            <button className="btn">Create Rule</button>
          </div>
        </div>

        {/* Vacation */}
        <div className="card">
          <div className="card-content">
            <h2>
              Vacation Responder 
              <span className="tooltip">
                ?
                <span className="tooltip-text">
                  Send automatic replies to incoming emails when you're away.
                </span>
              </span>
            </h2>

            <label className="toggle">
              <input
                type="checkbox"
                checked={vacationEnabled}
                onChange={() => setVacationEnabled(!vacationEnabled)}
              />
              Enable auto-reply
            </label>

            {vacationEnabled && (
              <>
                <textarea
                  className="textarea"
                  placeholder="Auto-reply message"
                  value={vacationMsg}
                  onChange={(e) => setVacationMsg(e.target.value)}
                />
                <button className="btn">Save</button>
              </>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}