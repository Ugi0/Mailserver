
import { Request, Response, Router } from "express";
import db from "../services/db.js";
import { rebuildAndApply } from "../services/applyMailboxChanges.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, forwardTo } = req.body;

    await db.query(
      `
      DELETE FROM forwarding_rules
      WHERE user_id = $1 AND source_email = $2
      `,
      [userId, email]
    );

    const result = await db.query(
      `INSERT INTO forwarding_rules (user_id, source_email, destination_email)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, email, forwardTo]
    );

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Forwarding rule added",
      rule: result.rows[0],
      sieve: response.data,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id;

    const rule = await db.query(
      "SELECT * FROM forwarding_rules WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (!rule.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const email = rule.rows[0].source_email;

    await db.query("DELETE FROM forwarding_rules WHERE id = $1", [id]);

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Forwarding rule removed",
      sieve: response.data,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;