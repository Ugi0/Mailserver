// sieveClient.ts
import axios from "axios";

const SIEVE_API = process.env.SIEVE_API_URL

if (!SIEVE_API) {
  throw new Error("SIEVE_API_URL environment variable is not set");
}

const API_KEY = process.env.SIEVE_API_KEY

if (!API_KEY) {
  throw new Error("SIEVE_API_KEY environment variable is not set");
}

export const sieveClient = axios.create({
  baseURL: SIEVE_API,
  headers: {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  },
});
