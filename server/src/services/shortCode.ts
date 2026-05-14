import { customAlphabet } from "nanoid";

// Base-62 alphabet: digits + lowercase + uppercase
// 62^8 ≈ 218 trillion combinations — effectively collision-free at MVP scale.
// The DB UNIQUE constraint on short_code is the safety net for the rare collision.
const generateId = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  8,
);

export function generateShortCode(): string {
  return generateId();
}
