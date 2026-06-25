import pkg from "pg";
import crypto from "crypto";

const { Pool } = pkg;

const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_DB = process.env.POSTGRES_DB;

const pool = new Pool({
  connectionString: `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@database:5432/${POSTGRES_DB}`,
});

function generateCode() {
  const part = crypto.randomBytes(12).toString("hex").toUpperCase();
  return `TOKKI-${part.slice(0, 8)}-${part.slice(8, 16)}-${part.slice(16, 24)}`;
}

async function createCodes(amount) {
  if (!amount || isNaN(amount) || amount <= 0) {
    console.error("Please provide a valid number of codes.");
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    console.log(`\nGenerating ${amount} registration codes...\n`);

    for (let i = 0; i < amount; i++) {
      let inserted = false;

      while (!inserted) {
        const code = generateCode();

        try {
          await client.query(
            `INSERT INTO registration_codes (code) VALUES ($1)`,
            [code]
          );

          console.log(`${code}`);
          inserted = true;
        } catch (err) {
          console.log(err);
          // Retry if duplicate
        }
      }
    }

    console.log("\nDone!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

const amount = parseInt(process.argv[2], 10);

createCodes(amount);