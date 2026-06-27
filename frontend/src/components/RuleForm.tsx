import { useState, useEffect } from "react";
import "./RuleForm.css";
import type { FilterRule } from "../types/filterRule";

type RuleFormProps = {
  onCancel: () => void;
  onSave: (rule: FilterRule) => void;
  initialRule?: FilterRule;
};

export default function RuleForm({onCancel, onSave, initialRule}: RuleFormProps) {
  const [name, setName] = useState("");
  const [field, setField] = useState("subject");
  const [match, setMatch] = useState("contains");
  const [value, setValue] = useState("");

  const [headerName, setHeaderName] = useState("");

  const [actionType, setActionType] = useState("fileinto");

  const [folder, setFolder] = useState("");
  const [redirectAddress, setRedirectAddress] = useState("");

  const [copy, setCopy] = useState(true);
  const [create, setCreate] = useState(true);
  const [stop, setStop] = useState(false);

  useEffect(() => {
    if (initialRule) {
      setName(initialRule.name || "");
      setField(initialRule.field || "subject");
      setMatch(initialRule.match || "contains");
      setValue(initialRule.value || "");
      setHeaderName(initialRule.header || "");

      setActionType(initialRule.action?.type || "fileinto");
      const action = initialRule.action;

      if (action?.type === "fileinto") {
        setFolder(action.folder || "");
        setRedirectAddress("");
        setCreate(action.create ?? true);
        setCopy(true);
      } else if (action?.type === "redirect") {
        setRedirectAddress(action.address || "");
        setFolder("");
        setCopy(action.copy ?? true);
        setCreate(true);
      } else if (action?.type === "keep") {
        setStop(action.stop ?? true);
      } else if (action?.type === "discard") {
        setStop(action.stop ?? true);
      }
      setStop(initialRule.action?.stop ?? true);
    }
  }, [initialRule]);

  const handleSubmit = () => {
    if (!name || !value) {
      alert("Name and value are required");
      return;
    }

    if (field === "header" && !headerName) {
      alert("Header name is required");
      return;
    }

    let action;

    if (actionType === "fileinto") {
      if (!folder) {
        alert("Folder is required");
        return;
      }

      action = {
        type: "fileinto",
        folder,
        create,
        stop,
      };

    } else if (actionType === "redirect") {
      if (!redirectAddress) {
        alert("Forward address is required");
        return;
      }

      action = {
        type: "redirect",
        address: redirectAddress,
        copy,
        stop,
      };

    } else if (actionType === "keep") {
      action = {
        type: "keep",
        stop,
      };

    } else if (actionType === "discard") {
        action = {
            type: "discard",
            stop: true,
        };
    }

    const rule = {
      name,
      field,
      match,
      value,
      action,
      enabled: true,
      ...(field === "header" ? { header: headerName } : {}),
    } as FilterRule;

    onSave(rule);
  };

  return (
    <div className="form">
      <h4>Rule Settings</h4>

      <input
        className="input"
        placeholder="Rule name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <select
        className="input"
        value={field}
        onChange={(e) => setField(e.target.value)}
      >
        <option value="subject">Subject</option>
        <option value="from">From</option>
        <option value="to">To</option>
        <option value="cc">Cc</option>
        <option value="header">Header (custom)</option>
      </select>

      {field === "header" && (
        <input
          className="input"
          placeholder="Header name (e.g. X-Priority)"
          value={headerName}
          onChange={(e) => setHeaderName(e.target.value)}
        />
      )}

      <select
        className="input"
        value={match}
        onChange={(e) => setMatch(e.target.value)}
      >
        <option value="contains">contains</option>
        <option value="is">is exactly</option>
        <option value="matches">matches (wildcard)</option>
      </select>

      <input
        className="input"
        placeholder="Value"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />

      <h4>Action</h4>

      <select
        className="input"
        value={actionType}
        onChange={(e) => setActionType(e.target.value)}
      >
        <option value="fileinto">Move to folder</option>
        <option value="redirect">Forward</option>
        <option value="keep">Keep in inbox</option>
        <option value="discard">Discard</option>
      </select>

      {actionType === "fileinto" && (
        <>
          <input
            className="input"
            placeholder="Folder name"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={create}
              onChange={(e) => setCreate(e.target.checked)}
            />
            Create folder if missing
          </label>
        </>
      )}

      {actionType === "redirect" && (
        <>
          <input
            className="input"
            placeholder="Forward to email"
            value={redirectAddress}
            onChange={(e) => setRedirectAddress(e.target.value)}
          />

          <label>
            <input
              type="checkbox"
              checked={copy}
              onChange={(e) => setCopy(e.target.checked)}
            />
            Keep a copy
          </label>
        </>
      )}

      <label>
        <input
          type="checkbox"
          checked={stop}
          onChange={(e) => setStop(e.target.checked)}
        />
        Stop processing further rules
      </label>

      <div className="modal-actions">
        <button onClick={onCancel}>Cancel</button>
        <button className="btn" onClick={handleSubmit}>
          Save Rule
        </button>
      </div>
    </div>
  );
}