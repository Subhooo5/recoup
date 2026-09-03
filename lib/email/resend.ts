import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  throw new Error("RESEND_API_KEY must be set to create the Resend client");
}

const globalForResend = globalThis as unknown as {
  resend: Resend | undefined;
};

export const resend = globalForResend.resend ?? new Resend(resendApiKey);

export const RECOVERY_EMAIL_SENDER = "Recoup <onboarding@resend.dev>";

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend;
}
