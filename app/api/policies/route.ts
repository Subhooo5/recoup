import { prisma } from "@/lib/prisma";
import { jsonResponse, toIsoString } from "@/lib/api/serialize";

export const runtime = "nodejs";

export async function GET() {
  const policies = await prisma.policy.findMany({
    orderBy: { createdAt: "desc" },
  });

  return jsonResponse({
    items: policies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      pipeline: policy.pipeline,
      ruleType: policy.ruleType,
      config: policy.config,
      active: policy.active,
      createdAt: toIsoString(policy.createdAt),
    })),
  });
}
