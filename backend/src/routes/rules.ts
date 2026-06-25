import { Router, Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  // GET /api/rules
  res.json({ rules: [] });
});

export default router;