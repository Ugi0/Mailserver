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

  console.log(payload);

  if (responder.rows.length) {
    payload.autoreply = JSON.parse(responder.rows[0].rule_content);
  }

  return sieveClient.post("/v1/sieve/apply", payload);
}

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

router.post("/forward", async (req: Request, res: Response) => {
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
    console.log(err);
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
    console.log(err);
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
    console.log(err);
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
    console.log(err);
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
    console.log(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
