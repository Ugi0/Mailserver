import { Request, Response, Router } from "express";
import db from "../services/db.js";
import { rebuildAndApply } from "../services/applyMailboxChanges.js";
import { AutoReply } from "../types/mailTypes.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, subject, message, days } = req.body;

    const rule: AutoReply = {
      id: 0, // Placeholder, will be set by the database
      enabled: true,
      subject,
      message,
      days: days || 1,
    };

    await db.query(
      "DELETE FROM responder_rules WHERE user_id = $1",
      [userId]
    );

    const result = await db.query(
      `INSERT INTO responder_rules (user_id, message)
       VALUES ($1, $2) RETURNING *`,
      [userId, JSON.stringify(rule)]
    );

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Auto-reply set",
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
      "SELECT * FROM responder_rules WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (!rule.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    await db.query("DELETE FROM responder_rules WHERE id = $1", [id]);

    const forwarding = await db.query(
      "SELECT * FROM forwarding_rules WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    const email =
      forwarding.rows[0]?.source_email || "fallback@example.com";

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Auto-reply removed",
      sieve: response.data,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/toggle", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id;
    const { enabled } = req.body;

    const existing = await db.query(
      "SELECT * FROM responder_rules WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const rule = existing.rows[0];
    const content = JSON.parse(rule.message);

    content.enabled = enabled;

    await db.query(
      "UPDATE responder_rules SET message = $1 WHERE id = $2",
      [JSON.stringify(content), id]
    );

    const forwarding = await db.query(
      "SELECT * FROM forwarding_rules WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    if (!forwarding.rows.length) {
      return res.status(404).json({ error: "No forwarding rule found for user" });
    }

    const email = forwarding.rows[0].source_email;

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: `Auto-reply ${enabled ? "enabled" : "disabled"}`,
      rule: content,
      sieve: response.data,
    });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;