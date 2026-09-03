import Razorpay from "razorpay";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  throw new Error(
    "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set to create the Razorpay client",
  );
}

const globalForRazorpay = globalThis as unknown as {
  razorpay: Razorpay | undefined;
};

export const razorpay =
  globalForRazorpay.razorpay ??
  new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRazorpay.razorpay = razorpay;
}
