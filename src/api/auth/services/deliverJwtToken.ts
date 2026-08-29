import jwt, { type SignOptions } from "jsonwebtoken";

const deliverJwtToken = (
  payload: string | Buffer | object,
  expiresIn: SignOptions["expiresIn"] = "3m",
  secret = process.env.JWT_SECRET as string,
  options: Omit<SignOptions, "expiresIn"> = {},
) => {
  if (!secret) {
    throw ApiError(500, "JWT secret is required");
  }

  const token = jwt.sign(payload, secret, {
    expiresIn,
    ...options,
  });

  return token;
};

export default deliverJwtToken;
