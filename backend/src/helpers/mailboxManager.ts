import { spawn } from "child_process";
import { sieveClient } from "../services/sieveClient.js";

function validateEmail(email: string): boolean {
  console.log("Validating email:", email);
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) return false;

  if (/[\n\r\0]/.test(password)) return false;

  return true;
}

export async function createMailbox(email: string, password: string): Promise<void> {
  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }

  if (!validatePassword(password)) {
    throw new Error("Invalid password");
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("docker", [
      "exec",
      "mailserver",
      "setup",
      "email",
      "add",
      email,
      password,
    ], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let errOutput = "";

    proc.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Mailbox creation failed: ${errOutput}`));
      }
      resolve();
    });
  });

  try {
    await sieveClient.post("/v1/sieve/apply", {
      email,
      filters: [],
    });
  } catch (err) {
    console.error("Sieve initialization failed:", err);
  }
}

export async function addAlias(email: string, alias: string): Promise<void> {
  if (!validateEmail(email) || !validateEmail(alias)) {
    throw new Error("Invalid email or alias format");
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("docker", [
      "exec",
      "mailserver",
      "setup",
      "alias",
      "add",
      alias,
      email,
    ], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let errOutput = "";

    proc.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Alias creation failed: ${errOutput}`));
      }
      resolve();
    });
  });
}

export async function removeAlias(email: string, alias: string): Promise<void> {
  if (!validateEmail(email) || !validateEmail(alias)) {
    throw new Error("Invalid alias format");
  }

  await new Promise<void>((resolve, reject) => {
    const proc = spawn("docker", [
      "exec",
      "mailserver",
      "setup",
      "alias",
      "del",
      email,
      alias,
    ], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let errOutput = "";

    proc.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Alias removal failed: ${errOutput}`));
      }
      resolve();
    });
  });
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  if (!validateEmail(email)) {
    throw new Error("Invalid email format");
  }

  const message = `From: welcome@tokkicorp.com
To: ${email}
Subject: Welcome to TokkiCorp!

Welcome! Your mailbox has been created.
`;

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      "docker",
      [
        "exec",
        "-i",
        "mailserver",
        "sendmail",
        "-f",
        "welcome@tokkicorp.com",
        email,
      ],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let errOutput = "";

    proc.stdin.write(message);
    proc.stdin.end();

    proc.stderr.on("data", (data) => {
      errOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code !== 0) {
        return reject(
          new Error(`Sending welcome email failed: ${errOutput}`)
        );
      }
      resolve();
    });
  });
}