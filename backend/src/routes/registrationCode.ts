import { Router, Request, Response } from "express";
import { authMiddleware } from "../helpers/middleware.js";
import { hasUserAgreedToTerms, validateRegistrationCode } from "../services/db_queries.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  // POST /api/registration-code
  const code = req.body.code;

  await validateRegistrationCode(code)
    .then((isValid) => {
      if (isValid) {
        res.json({ valid: true });
      } else {
        res.status(400).json({ valid: false, error: "Invalid or used registration code" });
      }
    });
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  // GET /api/registration-code
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(400).send("User ID is required");
  }

  const agreedToTerms = await hasUserAgreedToTerms(userId);
  res.json({ agreedToTerms });
});

export default router;