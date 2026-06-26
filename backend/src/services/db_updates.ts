import db from "./db.js";
import bcrypt from "bcrypt";

export async function agreeToTerms(userId: number) {
  await db.query(
    `UPDATE users SET agreed_to_terms = TRUE WHERE id = $1`,
    [userId]
  );
}

export async function createUser(email: string, password: string): Promise<number> {
  const saltRounds = 12;

  const hashedPassword = await bcrypt.hash(password, saltRounds);

  const result = await db.query(
    `INSERT INTO users (email, password)
    VALUES ($1, $2)
    RETURNING id`,
    [email, hashedPassword]
    );

  const userId = result.rows[0].id;
  return userId;
}

export async function markCodeAsUsed(code: string, userId: number) {
  await db.query(
    `UPDATE registration_codes SET used = TRUE, used_by = $1 WHERE code = $2`,
    [userId, code]
  );
}