import crypto from "node:crypto";

export function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function verifyHash(value: string, hashed: string): boolean {
  return hashSecret(value) === hashed;
}
