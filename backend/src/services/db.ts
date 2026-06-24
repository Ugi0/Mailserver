import pg from "pg";

const { Pool } = pg;

if (!process.env.POSTGRES_USER) {
  throw new Error("POSTGRES_USER environment variable is not set");
}

if (!process.env.POSTGRES_PASSWORD) {
  throw new Error("POSTGRES_PASSWORD environment variable is not set");
}

if (!process.env.POSTGRES_DB) {
  throw new Error("POSTGRES_DB environment variable is not set");
}

const db = new Pool({
  connectionString: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@database:5432/${process.env.POSTGRES_DB}`,
});

export default db;