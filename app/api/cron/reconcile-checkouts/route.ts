import { reconcileCheckouts } from "@/lib/reconciliation/reconcile-checkouts";

export const runtime = "nodejs";

const requestIsAuthorized = (request: Request) => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

const runReconciliation = async (request: Request) => {
  if (!requestIsAuthorized(request)) {
    return new Response(null, { status: 401 });
  }

  const summary = await reconcileCheckouts();

  return Response.json(summary, { status: 200 });
};

export async function GET(request: Request) {
  return runReconciliation(request);
}

export async function POST(request: Request) {
  return runReconciliation(request);
}
