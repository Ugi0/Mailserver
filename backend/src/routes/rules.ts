import { Router, Request, Response } from "express";
import db from "../services/db.js";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    const emailQuery = await db.query(
      "SELECT email FROM users WHERE id = $1",
      [userId]
    );

    const email = emailQuery.rows[0]?.email;

    if (!email) {
      return res.status(404).json({ error: "User email not found" });
    }

    const forwardingResult = await db.query(
      "SELECT * FROM forwarding_rules WHERE user_id = $1",
      [userId]
    );

    const forwardingRows = forwardingResult.rows;

    const aliases = forwardingRows
      .filter((f) => f.destination_email === email)
      .map((f) => f.source_email);

    const forwardingRule = forwardingRows.find(
      (f) => f.source_email === email
    );

    const forwardingEmail = { id: forwardingRule?.id, destination_email: forwardingRule?.destination_email };
    const forwardingEnabled = forwardingRule?.enabled ?? false;

    const filtersResult = await db.query(
      "SELECT * FROM sieve_rules WHERE user_id = $1",
      [userId]
    );

    const responderResult = await db.query(
      "SELECT * FROM responder_rules WHERE user_id = $1 LIMIT 1",
      [userId]
    );

    let vacatationEnabled = false;
    let autoreply = null;

    if (responderResult.rows.length > 0) {
      try {
        autoreply = JSON.parse(responderResult.rows[0].rule_content);
        vacatationEnabled = !!autoreply?.enabled;
      } catch (err) {
        console.error("Failed to parse autoresponder:", err);
      }
    }

    res.json({
      email,
      forwardingEmail,
      forwardingEnabled,
      aliases,
      filters: filtersResult.rows ?? [],
      autoreply,
      vacatationEnabled,
    });

  } catch (err) {
    console.error("Failed to fetch rules:", err);
    res.status(500).json({ error: "Failed to fetch rules"});
  }
});

export default router;
