import { createHmac, randomInt } from "crypto";
import { VerificationPurpose } from "@/entities/VerificationCodeEntity";

export const CODE_MINUTES: Record<VerificationPurpose, number> = { reset: 15, confirm: 30 };
export const MAX_ATTEMPTS = 5;

export const newCode = () => String(randomInt(0, 1000000)).padStart(6, "0");

export const hashCode = (userId: number, purpose: VerificationPurpose, code: string) =>
  createHmac("sha256", process.env.JWT_SECRET || process.env.COOKIE_SECRET || "kilist")
    .update(`${userId}:${purpose}:${code}`)
    .digest("hex");
