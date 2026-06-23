import { useState } from "react";
import "./Instructions.css";
import EmailInstructions from "../components/EmailInstructions";

export default function Instructions() {
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [disagreeHovered, setDisagreeHovered] = useState(false);
  const [disagreeLocation, setDisagreeLocation] = useState({ x: 0, y: 0 });
  const [disagreeCounter, setDisagreeCounter] = useState(0);

  return (
    <div className="instructions-container">
      <div className="description">
        <h2>
          Welcome to the Tokkicorp Mailbox! This page will help you in setting up your mailbox and ensure that you use it for the intended purpose. Please follow the instructions below to get started.
        </h2>
        <p>
          If you have any questions or need assistance, please contact our support person at <a href="mailto:ugi@tokkicorp.com">ugi@tokkicorp.com</a> or just message him through Discord.
        </p>
      </div>

      {!agreedToRules ? (
      <div className="rules">
        <h3>There's some common agreement stuff you will need to agree to. Really basic stuff, barely worth reading.</h3>
        <ul>
          <li>You will not use the mailbox for spam or malicious purposes.</li>
          <li>Don't misuse the mailbox or violate any laws.</li>
          <li>Don't tarnish the reputation of the company.</li>
          <li>You will gamble a minimum of 1000 $TKS whenever you have the opportunity.</li>
          <li>You will promise to be helpful to boss when she asks for help in games, but you must throw a complete lie amongst the truths every now and then, to make her doubt everything.</li>
          <li>Your body and soul will be bound to a 5 year contract for the company to use.</li>
          <li>You will say "I Agree" to the company even when you don't mean it.</li>
          <li>You will say a prayer of gratitude to the company every morning and every second monday at noon.</li>
          <li>Your firstborn will be sacrificed in the name of the company.</li>
          <li>Blah blah blah... The boring legal stuff</li>
        </ul>
        <div className="rules-actions">
          <button
            id="disagree-button"
            onMouseEnter={() => {
              const newLocation = getRandomPosition();
              setDisagreeCounter(disagreeCounter + 1);
              setDisagreeLocation(newLocation);
              setDisagreeHovered(true);
            }}
            style={
              disagreeHovered
                ? { position: "fixed", left: disagreeLocation.x, top: disagreeLocation.y }
                : {}
            }
          >
            <p style={disagreeCounter > 10 ? { color: "red", fontWeight: "bold", fontSize: "1.1rem" } : {}}>
              {disagreeCounter > 10 ? "I am very persistent and annoying" : "I Don't Agree"}
            </p>
          </button>

          <button id="agree-button" onClick={() => setAgreedToRules(true)}>
            I Agree
          </button>
        </div>
      </div>
      ) : (
        <EmailInstructions />
      )
      }
    </div>
  )
}

function getRandomPosition() {
  const x = Math.floor(Math.random() * (window.innerWidth - 100));
  const y = Math.floor(Math.random() * (window.innerHeight - 50));
  console.log(`New position: x=${x}, y=${y}`);
  return { x, y };
}
