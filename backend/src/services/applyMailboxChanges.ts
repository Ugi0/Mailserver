import db from "./db.js";
import { sieveClient } from "./sieveClient.js";

export async function rebuildAndApply(userId: number, email: string) {
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
    sieveFilters.push(JSON.parse(r.message));
  }

  const payload: any = {
    email,
    filters: sieveFilters,
  };

  console.log(payload);

  if (responder.rows.length) {
    const rule = JSON.parse(responder.rows[0].message);

    if (rule.enabled) {
      payload.autoreply = rule;
    }
  }

  return sieveClient.post("/v1/sieve/apply", payload);
}