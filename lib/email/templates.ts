export type RecoveryEmailContent = {
  subject: string;
  html: string;
  text: string;
};

export const formatRupees = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);

const wrapHtml = (customerName: string, paragraphs: string[]) =>
  [
    '<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a">',
    `<p>Hi ${customerName},</p>`,
    ...paragraphs.map((paragraph) => `<p>${paragraph}</p>`),
    "<p>Thanks,<br />The Recoup Team</p>",
    "</div>",
  ].join("");

const wrapText = (customerName: string, paragraphs: string[]) =>
  [`Hi ${customerName},`, "", ...paragraphs, "", "Thanks,", "The Recoup Team"].join(
    "\n",
  );

export const paymentLinkEmail = ({
  customerName,
  amountPaise,
  paymentLinkUrl,
  invitesAlternateMethod,
}: {
  customerName: string;
  amountPaise: number;
  paymentLinkUrl: string;
  invitesAlternateMethod: boolean;
}): RecoveryEmailContent => {
  const amount = formatRupees(amountPaise);

  const paragraphs = invitesAlternateMethod
    ? [
        `Your recent payment of ${amount} did not go through. The issue looks like it was with the payment method rather than your order.`,
        `You can complete it here with a different payment method, such as UPI, netbanking, or another card: <a href="${paymentLinkUrl}">${paymentLinkUrl}</a>`,
        "Your order is held while you complete payment.",
      ]
    : [
        `Your recent payment of ${amount} did not complete.`,
        `You can finish it securely here: <a href="${paymentLinkUrl}">${paymentLinkUrl}</a>`,
        "Your order is held while you complete payment.",
      ];

  const textParagraphs = invitesAlternateMethod
    ? [
        `Your recent payment of ${amount} did not go through. The issue looks like it was with the payment method rather than your order.`,
        `You can complete it with a different payment method, such as UPI, netbanking, or another card: ${paymentLinkUrl}`,
        "Your order is held while you complete payment.",
      ]
    : [
        `Your recent payment of ${amount} did not complete.`,
        `You can finish it securely here: ${paymentLinkUrl}`,
        "Your order is held while you complete payment.",
      ];

  return {
    subject: invitesAlternateMethod
      ? `Complete your ${amount} payment with another method`
      : `Complete your ${amount} payment`,
    html: wrapHtml(customerName, paragraphs),
    text: wrapText(customerName, textParagraphs),
  };
};

export const reminderEmail = ({
  customerName,
  amountPaise,
}: {
  customerName: string;
  amountPaise: number;
}): RecoveryEmailContent => {
  const amount = formatRupees(amountPaise);
  const paragraphs = [
    `You left an order of ${amount} without completing payment.`,
    "If you still want it, you can pick up where you left off from your cart. If something went wrong at checkout, replying to this email will reach us.",
  ];

  return {
    subject: `Your ${amount} order is still waiting`,
    html: wrapHtml(customerName, paragraphs),
    text: wrapText(customerName, paragraphs),
  };
};

export const cardUpdateEmail = ({
  customerName,
  amountPaise,
}: {
  customerName: string;
  amountPaise: number | null;
}): RecoveryEmailContent => {
  const renewalLine =
    amountPaise === null
      ? "Your subscription renewal could not be charged to your saved card."
      : `Your subscription renewal of ${formatRupees(amountPaise)} could not be charged to your saved card.`;

  const paragraphs = [
    renewalLine,
    "This usually means the card has expired, been replaced, or was declined by your bank. Updating your saved card will let the next renewal go through automatically.",
    "No action is needed beyond updating the card, and your subscription stays active in the meantime.",
  ];

  return {
    subject: "Please update your saved card",
    html: wrapHtml(customerName, paragraphs),
    text: wrapText(customerName, paragraphs),
  };
};
