import { Router, Request, Response } from "express";
import db from "../services/db.js";
import { addAlias, removeAlias } from "../helpers/mailboxManager.js";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const emailQuery = await db.query("SELECT email FROM users WHERE id = $1", [userId]);

    const email = emailQuery.rows[0]?.email;

    if (!email) {
      return res.status(404).json({ error: "User email not found" });
    }

    const { alias } = req.body;

    if (!alias || alias.trim() === "") {
      return res.status(400).json({ error: "Alias email is required" });
    }

    await addAlias(email, alias);

    const result = await db.query(
      `INSERT INTO forwarding_rules (user_id, source_email, destination_email, enabled)
       VALUES ($1, $2, $3, true) RETURNING *`,
      [userId, alias, email]
    );

    res.json({
      message: "Alias added",
      rule: result.rows[0],
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

    await removeAlias(rule.rows[0].destination_email, rule.rows[0].source_email);

    if (!rule.rows.length) {
      return res.status(404).json({ error: "Rule not found" });
    }

    await db.query("DELETE FROM forwarding_rules WHERE id = $1", [id]);

    res.json({ message: "Alias removed" });
  } catch (err: any) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;