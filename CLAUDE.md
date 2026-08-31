@AGENTS.md

# Recoup

An AI-agent revenue recovery platform built for the Razorpay Buildathon (Track: AI Revenue Recovery). Three pipelines — Payment Degradation, Checkout Drop-off, Failed Subscription — each detect revenue at risk, diagnose it with an LLM agent, and execute a governed recovery action.

## Durable rules

These apply to every session working in this repo, without exception.

### No comments anywhere, ever

No comments in TypeScript, TSX, config files, Prisma schema, or CSS. None. Names and structure carry the meaning instead.

This includes tooling directives: `// eslint-disable-next-line`, `// @ts-expect-error`, `// prettier-ignore` and friends are comments and are equally forbidden. When a lint rule fires, restructure the code so the rule no longer applies. Markdown documentation is prose, not code, and is exempt.

### LLM output never executes directly

No agent response, tool call, or model-generated value may trigger a side effect on its own. Every action an agent proposes routes through a deterministic policy gate that decides — in plain code, not in a prompt — whether the action is permitted, capped, or rejected. The gate is the only thing that may call an executor.

The policy gate is built in a later phase. The rule is recorded now so nothing is built that assumes a shortcut around it.

### No raw card or payment credential data is ever stored

No PAN, CVV, expiry, full card number, UPI PIN, or equivalent credential enters the database, logs, event payloads, agent prompts, or the audit ledger. Store gateway-issued tokens and identifiers only. If an upstream payload contains credential fields, drop them at the ingestion boundary before anything is persisted.

### Idempotency on every webhook-triggered write

Any write that a redelivered webhook could trigger must be idempotent. Razorpay and other providers redeliver on timeout, retry, and replay. Key writes on a stable provider-supplied identifier plus event type, and make repeat delivery a no-op rather than a duplicate row, duplicate recovery action, or duplicate customer contact.

### Shared spine, independent brains

The three pipelines share one set of infrastructure: ingestion, normalization, event store, context and enrichment, policy gate, execution, audit ledger, dashboard. They do not share diagnosis or decision logic. Each pipeline owns its own trigger conditions, its own agent, and its own reasoning about what a case means and what to do about it. Add shared behavior to the spine; keep pipeline-specific judgment inside that pipeline.

### Stay inside the current phase

Build only what the current phase specifies. Do not build ahead of instruction. If a task appears to require inventing a database model, an agent, a tool, or business logic that the active phase has not asked for, stop and ask rather than guessing.

## Structure conventions

- `app/` holds routes only. Pages compose and render components; no large inline JSX blocks in page files.
- `components/` is top-level, not nested under `app/`. `components/ui/` is generated shadcn output and is not hand-edited by preference.
- Every file, folder, and component name is spelled out and self-explanatory. No abbreviations, no numeric suffixes.
- Import alias is `@/*`. The `src/` directory is deliberately not used.

## Stack decisions worth knowing

- **Prisma is pinned to 6.x on purpose.** Prisma 7 removed `url` and `directUrl` from schema files and requires a driver adapter on the client constructor. Version 6 keeps the Neon pooled-plus-direct pattern in `prisma/schema.prisma` and a plain `new PrismaClient()`. Do not upgrade to 7 without migrating the datasource config and the client singleton together. Note that `.claude/skills/` contains Prisma-authored skills produced by a Prisma 7 CLI; where they describe `prisma.config.ts` or driver adapters, this repo does not follow them.
- **shadcn/ui is built on Radix UI**, not Base UI. `components.json` records `"style": "radix-nova"`. Add components with `npx shadcn@latest add <name>`.
- **The corner radius scale is deliberately flat.** Every `--radius-*` step maps to `var(--radius)` so buttons, cards, and the nav pill share one radius with no per-component override.
- **Tailwind v4**, configured entirely in `app/globals.css` via `@theme inline`. There is no `tailwind.config.ts`.

## Current phase status

Phase 1 is complete: project scaffold, dependencies, design tokens, shared shell (navbar, footer, theme toggle), landing page, placeholder routes, and database connection wiring. There is no Prisma model, no agent, no tool, no webhook handler, and no pipeline logic yet.
