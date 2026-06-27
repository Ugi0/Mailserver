import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../helpers/middleware.js";
import { createMailbox, sendWelcomeEmail } from "../helpers/mailboxManager.js";
import db from "../services/db.js";
import { hasUserAgreedToTerms, isUsernameFree, validateRegistrationCode, verifyUser } from "../services/db_queries.js";
import { agreeToTerms, createUser, markCodeAsUsed } from "../services/db_updates.js";

const router = Router();

const SECRET = process.env.JWT_SECRET
if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

router.post("/ensure-free", async (req: Request, res: Response) => {
  // POST /api/users/ensure-free
  const { username, password } = req.body;
  const isFree = await isUsernameFree(username);
  if (!isFree) {
    return res.status(400).send("Username is already taken");
  }

  if (password.length < 8) {
    return res.status(400).send("Password must be at least 8 characters long");
  }
  res.json({ success: true });
});

router.post("/create", async (req: Request, res: Response) => {
  const { username, password, registrationCode } = req.body;

  try {
    const validationCodeValid = await validateRegistrationCode(registrationCode);
    if (!validationCodeValid) {
      return res.status(400).send("Invalid or used registration code");
    }

    const isFree = await isUsernameFree(username);
    if (!isFree) {
      return res.status(400).send("Username is already taken");
    }

    let userId;

    const email = `${username}@tokkicorp.com`;

    try {
      await createMailbox(email, password);

      await sendWelcomeEmail(email);
      
      userId = await createUser(email, password);
      await markCodeAsUsed(registrationCode, userId);
    } catch (mailError) {
      console.error("Mailbox creation failed:", mailError);

      await db.query("DELETE FROM users WHERE id = $1", [userId]);

      return res.status(500).json({
        error: "Failed to create mailbox",
      });
    }

    const token = jwt.sign({ userId }, SECRET, { expiresIn: "30d" });

    res.cookie("mail-session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== "development",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: "/",
    });

    res.json({ success: true, email });

  } catch (err: any) {
    res.status(500).json({
      error: "User creation failed",
    });
  }
});

router.post("/agree-terms", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).send("User ID is required");
  }

  await agreeToTerms(userId);

  res.json({ success: true });
});

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  res.json({ user: req.user?.userId });
});

router.post("/verify", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const userId = await verifyUser(username, password);
  if (!userId) {
    return res.status(400).send("Invalid username or password");
  }

  const hasAgreedToTerms = await hasUserAgreedToTerms(userId);

  const token = jwt.sign({ userId }, SECRET, { expiresIn: "30d" });

  res.cookie("mail-session-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 30,
    path: "/",
  });

  res.json({ agreedToTerms: hasAgreedToTerms });
});

export default router;