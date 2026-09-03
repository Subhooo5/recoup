import { prisma } from "@/lib/prisma";
import { jsonResponse } from "@/lib/api/serialize";

export const runtime = "nodejs";

export async function GET() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  return jsonResponse({ items: customers });
}
