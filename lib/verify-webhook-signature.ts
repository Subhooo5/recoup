import { createHmac, timingSafeEqual } from "crypto";

export const verifyWebhookSignature = (
  rawBody: string,
  receivedSignature: string | null,
  webhookSecret: string | undefined,
): boolean => {
  if (!receivedSignature || !webhookSecret) {
    return false;
  }

  const expectedSignature = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
};
