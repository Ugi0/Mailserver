import db from "../services/db.js";
import bcrypt from "bcrypt";

export async function isUsernameFree(email: string) {
  const result = await db.query(
    `SELECT 1 FROM users WHERE email = $1`,
    [email]
  );

  return result.rowCount === 0;
}

export async function validateRegistrationCode(code: string) {
  const result = await db.query(
    `SELECT EXISTS (SELECT 1 FROM registration_codes WHERE code = $1 AND used = FALSE) AS exists`,
    [code]
  );

  return result.rows[0].exists;
}

export async function markCodeAsUsed(code: string, userId: number) {
  await db.query(
    `UPDATE registration_codes SET used = TRUE, used_by = $1 WHERE code = $2`,
    [userId, code]
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

export async function agreeToTerms(userId: number) {
  await db.query(
    `UPDATE users SET agreed_to_terms = TRUE WHERE id = $1`,
    [userId]
  );
}

export async function verifyUser(email: string, password: string): Promise<number | null> {
  const result = await db.query(
    `SELECT password, id FROM users WHERE email = $1`,
    [email]
  );

  if (result.rowCount === 0) {
    return null;
  }

  const storedHash = result.rows[0].password;
  const userId = result.rows[0].id;

  if (await bcrypt.compare(password, storedHash)) {
    return userId;
  }

  const passwordValid = await bcrypt.compare(password, storedHash);
  if (passwordValid) {
    return userId;
  }

  return null;
}

export async function hasUserAgreedToTerms(userId: number): Promise<boolean> {
  const result = await db.query(
    `SELECT agreed_to_terms FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rowCount === 0) return false;

  return result.rows[0].agreed_to_terms;
}