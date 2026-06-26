import { Router, Request, Response } from "express";
import { sieveClient } from "../services/sieveClient.js";
import db from "../services/db.js";

const router = Router();

async function rebuildAndApply(userId: number, email: string) {
  const forwarding = await db.query(
    "SELECT * FROM forwarding_rules WHERE user_id = $1",
    [userId]
  );

  const filters = await db.query(
    "SELECT * FROM sieve_rules WHERE user_id = $1",
    [userId]
  );

  const responder = await db.query(
    "SELECT * FROM responder_rules WHERE user_id = $1 LIMIT 1",
    [userId]
  );

  const sieveFilters: any[] = [];

  for (const f of forwarding.rows) {
    sieveFilters.push({
      name: `Forward to ${f.destination_email}`,
      field: "to",
      match: "contains",
      value: email,
      action: {
        type: "redirect",
        address: f.destination_email,
        copy: true,
      },
    });
  }

  for (const r of filters.rows) {
    sieveFilters.push(JSON.parse(r.rule_content));
  }

  const payload: any = {
    email,
    filters: sieveFilters,
  };

  if (responder.rows.length) {
    payload.autoreply = JSON.parse(responder.rows[0].rule_content);
  }

  return sieveClient.post("/v1/sieve/apply", payload);
}

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  const forwarding = await db.query(
    "SELECT * FROM forwarding_rules WHERE user_id = $1",
    [userId]
  );

  const filters = await db.query(
    "SELECT * FROM sieve_rules WHERE user_id = $1",
    [userId]
  );

  const responder = await db.query(
    "SELECT * FROM responder_rules WHERE user_id = $1",
    [userId]
  );

  res.json({
    forwarding: forwarding.rows,
    filters: filters.rows,
    autoreply: responder.rows,
  });
});

router.post("/forward", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, forwardTo } = req.body;

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
    res.status(500).json({ error: err.message });
  }
});

router.delete("/forward/:id", async (req: Request, res: Response) => {
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
    res.status(500).json({ error: err.message });
  }
});

router.post("/filter", async (req: Request, res: Response) => {
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
      `INSERT INTO sieve_rules (user_id, rule_content)
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
    res.status(500).json({ error: err.message });
  }
});

router.delete("/filter/:id", async (req: Request, res: Response) => {
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
    res.status(500).json({ error: err.message });
  }
});

router.post("/autoreply", async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { email, subject, message, days } = req.body;

    const rule = {
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
      `INSERT INTO responder_rules (user_id, rule_content)
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
    res.status(500).json({ error: err.message });
  }
});

router.delete("/autoreply/:id", async (req: Request, res: Response) => {
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
    res.status(500).json({ error: err.message });
  }
});

export default router;
