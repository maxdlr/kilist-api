import { randomBytes } from "crypto";

// Characters chosen to avoid visually ambiguous pairs (0/O, 1/I/l) since the
// code is read aloud or typed manually as a fallback to scanning the QR code.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 6;

/**
 * Generates a short, URL-safe, human-friendly join code used to invite
 * members into a household (rendered as a QR code on the frontend).
 *
 * @returns A random uppercase alphanumeric code, e.g. "7K3QXZ"
 */
const generateJoinCode = (): string => {
  const bytes = randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return code;
};

export default generateJoinCode;
