import { useState } from "react";
import "./EmailInstructions.css";

export default function EmailInstructions() {
  const [openClient, setOpenClient] = useState<string | null>(null);

  function toggleClient(client: string) {
    setOpenClient((current) => (current === client ? null : client));
  }

  return (
    <div className="instructions-container">
        <div className="setup">
        <h3>
            This site won't be used for displaying the mail, as that would be too much of a hassle to get working.
            Instead I'll leave instructions here for how to get it working using most common email clients.
        </h3>
        <h3>
            Unfortunately the Tokkicorp domain is quite new, so it's not trusted by most email servers yet. 
            For this reason, I have used my own domain to host the mail server, which has been running for a while and is more trusted.
            Unfortunately, this means that the automatic setup of the email clients will not work, and you will have to manually enter the server settings.
        </h3>

        <h3>Choose your used email client and follow the instructions:</h3>

        <ul className="client-list">
            <li className={openClient === "outlook" ? "client-item open" : "client-item"}>
            <button
                type="button"
                className="client-link client-button"
                onClick={() => toggleClient("outlook")}
            >
                <img src="/logos/outlook.svg" alt="" className="client-logo" />
                <div className="client-text">
                <span className="client-name">Microsoft Outlook</span>
                <span className="client-subtitle">Windows, macOS, mobile</span>
                </div>
                <span className="client-chevron">{openClient === "outlook" ? "-" : "+"}</span>
            </button>

            {openClient === "outlook" && (
                <div className="client-panel">
                <p>
                    Microsoft Outlook doesn't actually work on Linux, so this is written based on the android version. Good luck if my instructions don't work.
                </p>
                <ol className="instruction-list">
                    <li>Get to the "Add Account" page in the Outlook app.</li>
                    <li>Enter your Tokkicorp email address.</li>
                    <li>Enter your mailbox password and display name.</li>
                    <li>Toggle Advanced settings.</li>
                    <li>Make sure the IMAP host is mail.ugi0.org and port is 993 for Incoming email.</li>
                    <li>Make sure the SMTP host is mail.ugi0.org and port is 465 for Outgoing email.</li>
                    <li>For me, outlook automatically detected these settings.</li>
                    <li>Click the check button in the top right to save the settings.</li>
                </ol>
                </div>
            )}
            </li>

            <li className={openClient === "apple-mail" ? "client-item open" : "client-item"}>
            <button
                type="button"
                className="client-link client-button"
                onClick={() => toggleClient("apple-mail")}
            >
                <img src="/logos/apple-mail.svg" alt="" className="client-logo" />
                <div className="client-text">
                <span className="client-name">Apple Mail</span>
                <span className="client-subtitle">macOS, iPhone, iPad</span>
                </div>
                <span className="client-chevron">{openClient === "apple-mail" ? "−" : "+"}</span>
            </button>

            {openClient === "apple-mail" && (
                <div className="client-panel">
                <ol className="instruction-list">
                    <li>Open Settings app and scroll down to "Apps"</li>
                    <li>Find the Mail app and choose it.</li>
                    <li>Click "Mail Accounts" and choose "Add Account"</li>
                    <li>Input your Tokkicorp email address and click "Next"</li>
                    <li>Click "Add Other Account" in the provider list and choose "Mail Account".</li>
                    <li>Input your account name and the password you created earlier. Note that this name will be visible in sent emails.</li>
                    <li>Click "Next"</li>
                    <li>Enter the following settings:
                    <br/>Incoming server 
                    <br/>Host name: mail.ugi0.org
                    <br/>Username: your Tokkicorp email address
                    <br/>Password: your mailbox password
                    </li>
                    <li>Outgoing server
                    <br/>Host name: mail.ugi0.org
                    <br/>Username: your Tokkicorp email address
                    <br/>Password: your mailbox password
                    </li>
                    <li>Click "Next" to finish the setup.</li>
                </ol>
                </div>
            )}
            </li>

            <li className={openClient === "thunderbird" ? "client-item open" : "client-item"}>
            <button
                type="button"
                className="client-link client-button"
                onClick={() => toggleClient("thunderbird")}
            >
                <img src="/logos/thunderbird.svg" alt="" className="client-logo" />
                <div className="client-text">
                <span className="client-name">Mozilla Thunderbird</span>
                <span className="client-subtitle">Windows, macOS, Linux</span>
                </div>
                <span className="client-chevron">{openClient === "thunderbird" ? "−" : "+"}</span>
            </button>

            {openClient === "thunderbird" && (
                <div className="client-panel">
                <ol className="instruction-list">
                    <li>Open Thunderbird and click the gear in the left sidebar to open settings.</li>
                    <li>Select "Account Settings"</li>
                    <li>Click "Add Account" to create a new mail account.</li>
                    <li>Enter any name, and the email and password you created earlier. Note that this name will be visible in sent emails.</li>
                    <li>Press "Configure manually"</li>
                    <li>Enter the following settings:
                    <br/>Incoming server: mail.ugi0.org
                    <br/>Protocol: IMAP
                    <br/>IMAP port: 993
                    <br/>IMAP security: SSL/TLS
                    </li>
                    <li>Outgoing server: mail.ugi0.org
                    <br/>Protocol: SMTP
                    <br/>SMTP port: 465
                    <br/>SMTP security: SSL/TLS
                    </li>
                    <li>When you're finished, click "Done" to save the settings.</li>
                </ol>
                </div>
            )}
            </li>

            <li className={openClient === "manual" ? "client-item open" : "client-item"}>
            <button
                type="button"
                className="client-link client-button"
                onClick={() => toggleClient("manual")}
            >
                <div className="client-logo manual-logo">⚙</div>
                <div className="client-text">
                <span className="client-name">Manual setup</span>
                <span className="client-subtitle">I know what I am doing, just give me the info</span>
                </div>
                <span className="client-chevron">{openClient === "manual" ? "−" : "+"}</span>
            </button>

            {openClient === "manual" && (
                <div className="client-panel">
                <div className="manual-grid">

                    <div className="manual-item">
                    <span className="manual-label">Incoming mail server (IMAP)</span>
                    <code>mail.ugi0.org</code>
                    </div>

                    <div className="manual-item">
                    <span className="manual-label">IMAP port</span>
                    <code>993</code>
                    </div>

                    <div className="manual-item">
                    <span className="manual-label">IMAP security</span>
                    <code>SSL/TLS</code>
                    </div>

                    <div className="manual-item">
                    <span className="manual-label">Outgoing mail server (SMTP)</span>
                    <code>mail.ugi0.org</code>
                    </div>

                    <div className="manual-item">
                    <span className="manual-label">SMTP port</span>
                    <code>465</code>
                    </div>

                    <div className="manual-item">
                    <span className="manual-label">SMTP security</span>
                    <code>SSL/TLS</code>
                    </div>
                </div>
                </div>
            )}
            </li>
        </ul>
        </div>

        <button id="done-button" onClick={() => window.location.href = "/manage"}>
            I am done
        </button>

    </div>
  );
}