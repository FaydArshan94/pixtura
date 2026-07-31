import crypto from "crypto";

const SECRET = process.env.SIGNED_URL_SECRET;

export const generateSignature = (s3Key, expires) => {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${s3Key}:${expires}`)
    .digest("hex");
};

export const verifySignature = (s3Key, expires, signature) => {
  const expected = crypto
    .createHmac("sha256", SECRET)
    .update(`${s3Key}:${expires}`)
    .digest("hex");

  if (signature.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
};
