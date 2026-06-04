import crypto from "crypto";

export function verifyGitHubSignature(
  payload: Buffer,
  signatureHeader: string | null,
  webhookSecret: string
) {
  if (!signatureHeader) {
    return false;
  }

  const signature = signatureHeader.replace("sha256=", "");
  const digest = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  if (signature.length !== digest.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}
