import { Request, Response, Router } from "express";
import db from "../services/db.js";
import { rebuildAndApply } from "../services/applyMailboxChanges.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, rule } = req.body;

    const result = await db.query(
      `INSERT INTO sieve_rules 
       (user_id, name, field, match_type, value, action_type, action_config, enabled)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        rule.name,
        rule.field,
        rule.match,
        rule.value,
        rule.action.type,
        JSON.stringify(rule.action),
        rule.enabled ?? true,
      ]
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

router.patch("/:id", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const id = req.params.id;
    const { email, rule } = req.body;

    const existing = await db.query(
      "SELECT * FROM sieve_rules WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    const result = await db.query(
      `UPDATE sieve_rules SET
        name = $1,
        field = $2,
        match_type = $3,
        value = $4,
        action_type = $5,
        action_config = $6,
        enabled = $7
       WHERE id = $8
       RETURNING *`,
      [
        rule.name,
        rule.field,
        rule.match,
        rule.value,
        rule.action.type,
        JSON.stringify(rule.action),
        rule.enabled ?? true,
        id,
      ]
    );

    const response = await rebuildAndApply(userId!, email);

    res.json({
      message: "Rule updated",
      rule: result.rows[0],
      sieve: response.data,
    });
  } catch (err: any) {
    console.error(err);
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

router.patch("/:id/toggle", async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { enabled } = req.body;
    const id = req.params.id;

    const existing = await db.query(
      "SELECT * FROM sieve_rules WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (!existing.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    await db.query(
      "UPDATE sieve_rules SET enabled = $1 WHERE id = $2",
      [enabled, id]
    );

    const emailQuery = await db.query(
      "SELECT email FROM users WHERE id = $1",
      [userId]
    );

    const email = emailQuery.rows[0]?.email;

    await rebuildAndApply(userId!, email);

    res.json({ message: "Updated" });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


export default router;