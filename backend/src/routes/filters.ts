import { Request, Response, Router } from "express";
import db from "../services/db.js";
import { rebuildAndApply } from "../services/applyMailboxChanges.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, field, value, folder } = req.body;

    const rule = {
      name: `Filter ${value}`,
      field,
      match: "contains",
      value,
      action: {
        type: "fileinto",
        folder,
        create: true,
        stop: true,
      },
    };

    const result = await db.query(
      `INSERT INTO sieve_rules (user_id, message)
       VALUES ($1, $2) RETURNING *`,
      [userId, JSON.stringify(rule)]
    );

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Filter rule added",
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
      "SELECT * FROM sieve_rules WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (!rule.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    await db.query("DELETE FROM sieve_rules WHERE id = $1", [id]);

    const forwarding = await db.query(
      "SELECT * FROM forwarding_rules WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    const email =
      forwarding.rows[0]?.source_email || "fallback@example.com";

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Filter rule removed",
      sieve: response.data,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;