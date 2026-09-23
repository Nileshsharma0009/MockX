import jwt from "jsonwebtoken";

export const JWT_ALGORITHM = "HS256";
const MIN_JWT_SECRET_BYTES = 32;

export function getValidatedJwtSecret(secret = process.env.JWT_SECRET) {
  if (typeof secret !== "string" || Buffer.byteLength(secret, "utf8") < MIN_JWT_SECRET_BYTES) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes.");
  }
  return secret;
}

const genToken = (id) => {
  return jwt.sign({ id }, getValidatedJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: "7d",
  });
};

export default genToken;
