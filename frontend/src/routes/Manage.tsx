import { useEffect, useState } from "react";
import "./Manage.css";
import { addForwarding, addForwardingAlias, removeForwarding, removeForwardingAlias } from "../helpers/forwarding";
import type { Alias, AutoReply, ForwardingEmail } from "../types/managementTypes";
import { setAutoReply, toggleAutoReply } from "../helpers/autoreply";

export default function EmailSettingsView() {
  const [aliasInput, setAliasInput] = useState<string>("");
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<any[]>([]);

  const [forwardingEnabled, setForwardingEnabled] = useState(false);
  const [forwardingEmail, setForwardingEmail] = useState<ForwardingEmail | null>(null);

  const [vacationEnabled, setVacationEnabled] = useState(false);
  const [vacationMsg, setVacationMsg] = useState<AutoReply | null>(null);

  useEffect(() => {
    fetch("/api/rules", {
      method: "GET",
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to fetch rules");
        return response.json();
      })
      .then((data) => {
        console.log(data);

        setEmail(data.email || "");
        setFilters(data.filters || []);
        setAliases(data.aliases || []);

        setForwardingEnabled(data.forwardingEnabled ?? false);
        setForwardingEmail(data.forwardingEmail || null);

        setVacationEnabled(data.vacatationEnabled ?? false);
        setVacationMsg(data.autoreply || null);
      })
      .catch((err) => {
        console.error("Error loading settings:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const addAlias = async () => {
    const email = aliasInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }
    if (!email.endsWith("@tokkicorp.com")) {
      alert("Only @tokkicorp.com aliases are allowed.");
      return;
    }
    if (aliases.length >= 5) {
      alert("You can only add up to 5 aliases.");
      return;
    }
    try {
      await addForwardingAlias(aliasInput, email);

      setAliases([...aliases, { alias_email: aliasInput }]);
      setAliasInput("");
    } catch (err) {
      alert(err);
      console.error(err);
    }
  };

  const removeAlias = async (index: number) => {
    const aliasToRemove = aliases[index];
    await removeForwardingAlias(aliasToRemove.id).then(() => {
      console.log("Alias removed successfully");
      setAliases(aliases.filter((_, i) => i !== index));
    }).catch((err) => {
      console.error("Error removing alias:", err);
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <div className="header">
        <button onClick={() => (window.location.href = "/instructions")}>
          ← Back to instructions
        </button>
        <h1>Email Settings</h1>
      </div>

      <div className="email-settings">
        <div className="card">
          <div className="card-content">
            <h2>Identity</h2>
            <p className="readonly">{email}</p>
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h2>
              Aliases {aliases.length}/5
              <span className="tooltip">
                ?
                <span className="tooltip-text">
                  Aliases let you receive emails sent to different addresses in
                  this mailbox.
                </span>
              </span>
            </h2>

            {aliases.length < 5 && (
              <div className="row">
                <input
                  className="input"
                  placeholder="alias@tokkicorp.com"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                />
              <button className="btn" onClick={addAlias}>
                Add
              </button>
            </div>
            )}

            <ul className="list">
              {aliases.map((a, i) => (
                <li key={i}>
                  {a.alias_email}
                  <button onClick={() => removeAlias(i)}>Remove</button>
                </li>
              ))}
            </ul>
          </div>
        </div>

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
                onChange={(e) => {
                  if (!e.target.checked) {
                    removeForwarding(forwardingEmail?.id);
                  } else {
                    addForwarding(email, forwardingEmail?.destination_email || "");
                  }
                  setForwardingEnabled(e.target.checked)
                }}
              />
              Enable forwarding
            </label>

            {forwardingEnabled && (
              <>
                <input
                  className="input"
                  placeholder="Forward to email"
                  value={forwardingEmail?.destination_email || ""}
                  onChange={(e) =>
                    setForwardingEmail({
                      ...forwardingEmail,
                      destination_email: e.target.value,
                    })
                  }
                />

                <button
                  className="btn"
                  onClick={() => {
                    addForwarding(email, forwardingEmail?.destination_email || "");
                  }}
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-content">
            <h2>
              Rules
              <span className="tooltip">
                ?
                <span className="tooltip-text">
                  Automatically organize, move, or delete incoming emails.
                  <br />
                  eg. "Move emails containing 'invoice' to the Finance folder"
                </span>
              </span>
            </h2>

            <ul className="list">
              {(filters || []).map((rule, i) => (
                <li key={i}>
                  {rule.name || "Unnamed rule"}
                </li>
              ))}
            </ul>

            <button className="btn">Create Rule</button>
          </div>
        </div>

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
                onChange={() => {
                  setVacationEnabled(!vacationEnabled)
                  toggleAutoReply(vacationMsg?.id, !vacationEnabled);
                }}
              />
              Enable auto-reply
            </label>

            {vacationEnabled && (
              <>
                <input
                  className="input"
                  placeholder="Auto-reply subject"
                  value={vacationMsg?.subject || ""}
                  onChange={(e) =>
                    setVacationMsg({
                      ...vacationMsg,
                      subject: e.target.value
                    })
                  }
                />
                <textarea
                  className="textarea"
                  placeholder="Auto-reply message"
                  value={vacationMsg?.message || ""}
                  onChange={(e) =>
                    setVacationMsg({
                      ...vacationMsg,
                      message: e.target.value
                    })
                  }
                />
                <button className="btn"
                  onClick={() => 
                    setAutoReply(email, vacationMsg?.subject || "", vacationMsg?.message || "", 1)
                  }
                >Save</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}