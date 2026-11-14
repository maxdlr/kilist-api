import { OAuth2Client } from "google-auth-library";

export type GoogleIdentity = { googleId: string; email: string; name: string };

const client = new OAuth2Client();

const verifyGoogleToken = async (idToken: unknown): Promise<GoogleIdentity> => {
  const audience = (process.env.GOOGLE_CLIENT_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (audience.length === 0) throw UserError(503, "auth.googleUnavailable");
  if (typeof idToken !== "string" || !idToken) throw UserError(400, "auth.googleInvalid");

  const payload = await client
    .verifyIdToken({ idToken, audience })
    .then((ticket) => ticket.getPayload())
    .catch((error) => {
      console.error("Google token rejected:", error?.message ?? error);
      return undefined;
    });

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    if (payload) console.error("Google token has no verified email", { hasEmail: !!payload.email });
    throw UserError(400, "auth.googleInvalid");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.given_name || payload.name || payload.email.split("@")[0]!,
  };
};

export default verifyGoogleToken;
