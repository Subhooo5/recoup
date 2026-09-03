import type { Customer, RecoveryCase } from "@prisma/client";

import { RECOVERY_EMAIL_SENDER, resend } from "@/lib/email/resend";
import { cardUpdateEmail, paymentLinkEmail, reminderEmail, type RecoveryEmailContent } from "@/lib/email/templates";
import { createPaymentLink } from "@/lib/razorpay-helpers";
import type { RecoveryDecision } from "@/lib/pipelines/types";

export type ExecutorInput = {
  recoveryCase: RecoveryCase;
  customer: Customer;
  decision: RecoveryDecision;
};

export type ExecutorResult = {
  success: boolean;
  providerMessageId: string | null;
  razorpayPaymentLinkId: string | null;
  subject: string | null;
  detail: string;
};

const describeError = (error: unknown) =>
  error instanceof Error ? error.message : JSON.stringify(error);

const sendRecoveryEmail = async (
  customer: Customer,
  content: RecoveryEmailContent,
): Promise<ExecutorResult> => {
  const { data, error } = await resend.emails.send({
    from: RECOVERY_EMAIL_SENDER,
    to: customer.email,
    subject: content.subject,
    html: content.html,
    text: content.text,
  });

  if (error) {
    return {
      success: false,
      providerMessageId: null,
      razorpayPaymentLinkId: null,
      subject: content.subject,
      detail: `Resend rejected the message: ${error.message}`,
    };
  }

  return {
    success: true,
    providerMessageId: data?.id ?? null,
    razorpayPaymentLinkId: null,
    subject: content.subject,
    detail: `Sent "${content.subject}" to ${customer.email}`,
  };
};

export const sendPaymentLink = async ({
  recoveryCase,
  customer,
  decision,
}: ExecutorInput): Promise<ExecutorResult> => {
  if (recoveryCase.amount === null) {
    return {
      success: false,
      providerMessageId: null,
      razorpayPaymentLinkId: null,
      subject: null,
      detail: "Case has no amount, so a payment link cannot be created",
    };
  }

  const applicationUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    const paymentLink = await createPaymentLink({
      amount: recoveryCase.amount,
      currency: "INR",
      description: `Recovery for ${recoveryCase.entityType} ${recoveryCase.sourceId}`,
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.phone ?? undefined,
      },
      notify: { email: false, sms: false },
      reminder_enable: false,
      notes: { recoveryCaseId: recoveryCase.id },
      ...(applicationUrl
        ? { callback_url: applicationUrl, callback_method: "get" }
        : {}),
    });

    const emailResult = await sendRecoveryEmail(
      customer,
      paymentLinkEmail({
        customerName: customer.name,
        amountPaise: recoveryCase.amount,
        paymentLinkUrl: paymentLink.short_url,
        invitesAlternateMethod:
          decision.proposedAction === "retry_alternate_route",
      }),
    );

    return {
      ...emailResult,
      razorpayPaymentLinkId: paymentLink.id,
      detail: emailResult.success
        ? `Created payment link ${paymentLink.id} and ${emailResult.detail.charAt(0).toLowerCase()}${emailResult.detail.slice(1)}`
        : `Created payment link ${paymentLink.id} but the email failed: ${emailResult.detail}`,
    };
  } catch (error) {
    return {
      success: false,
      providerMessageId: null,
      razorpayPaymentLinkId: null,
      subject: null,
      detail: `Razorpay payment link creation failed: ${describeError(error)}`,
    };
  }
};

export const notifyCustomer = async ({
  recoveryCase,
  customer,
}: ExecutorInput): Promise<ExecutorResult> => {
  try {
    return await sendRecoveryEmail(
      customer,
      reminderEmail({
        customerName: customer.name,
        amountPaise: recoveryCase.amount ?? 0,
      }),
    );
  } catch (error) {
    return {
      success: false,
      providerMessageId: null,
      razorpayPaymentLinkId: null,
      subject: null,
      detail: `Reminder email failed: ${describeError(error)}`,
    };
  }
};

export const requestCardUpdate = async ({
  recoveryCase,
  customer,
}: ExecutorInput): Promise<ExecutorResult> => {
  try {
    return await sendRecoveryEmail(
      customer,
      cardUpdateEmail({
        customerName: customer.name,
        amountPaise: recoveryCase.amount,
      }),
    );
  } catch (error) {
    return {
      success: false,
      providerMessageId: null,
      razorpayPaymentLinkId: null,
      subject: null,
      detail: `Card update email failed: ${describeError(error)}`,
    };
  }
};
