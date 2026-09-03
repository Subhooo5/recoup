import { z } from "zod";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const checkoutStartedTelemetrySchema = z.object({
  razorpayOrderId: z.string(),
  cartValue: z.number().int().optional(),
  itemsSummary: z.string().optional(),
  paymentMethodSelected: z.string().optional(),
  frontendSessionId: z.string().optional(),
});

const readRequestBody = async (request: Request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const requestBody = await readRequestBody(request);
  const parsedTelemetry = checkoutStartedTelemetrySchema.safeParse(requestBody);

  if (!parsedTelemetry.success) {
    return new Response(null, { status: 200 });
  }

  const telemetry = parsedTelemetry.data;

  try {
    const checkoutSession = await prisma.checkoutSession.findUnique({
      where: { razorpayOrderId: telemetry.razorpayOrderId },
      select: { id: true },
    });

    if (!checkoutSession) {
      return new Response(null, { status: 200 });
    }

    await prisma.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: {
        cartValue: telemetry.cartValue,
        itemsSummary: telemetry.itemsSummary,
        paymentMethodSelected: telemetry.paymentMethodSelected,
        frontendSessionId: telemetry.frontendSessionId,
        lastCheckedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(
      `checkout telemetry enrichment failed for order ${telemetry.razorpayOrderId}`,
      error,
    );
  }

  return new Response(null, { status: 200 });
}
