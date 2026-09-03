"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import { GradientBorder } from "@/components/landing/gradient-border";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pipelines = [
  {
    id: "payment-degradation",
    slug: "payment-degradation",
    name: "Payment Degradation",
    illustration: "/illustrations/payment-degradation.svg",
    description:
      "Gateways rarely fail outright. They slow down and start declining more often on a particular method, issuer, or network. Recoup watches success rate and latency across those slices, and when a route starts quietly degrading the agent diagnoses the cause and moves traffic somewhere healthier.",
  },
  {
    id: "checkout-drop-off",
    slug: "checkout-dropoff",
    name: "Checkout Drop-off",
    illustration: "/illustrations/checkout-dropoff.svg",
    description:
      "Most abandoned checkouts are interrupted, not lost. Recoup records where each session stopped and what it was worth, then works out whether the cause was friction, a broken step, or plain hesitation. Recovery ranges from a well-timed nudge to a repaired payment link.",
  },
  {
    id: "failed-subscription",
    slug: "failed-subscription",
    name: "Failed Subscription",
    illustration: "/illustrations/failed-subscription.svg",
    description:
      "A renewal that fails on Tuesday often succeeds on Thursday. Recoup reads the decline reason, the customer's payment history, and the value of the plan before deciding whether and when to retry. Cases that need a new payment method or a human are escalated rather than retried blindly.",
  },
];

const revealTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

export function PipelinesOverview() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={revealTransition}
        className="mx-auto max-w-2xl text-center"
      >
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Three pipelines, one spine
        </h2>
        <p className="mt-4 text-muted-foreground text-pretty">
          Each pipeline detects a different kind of revenue at risk and reasons
          about it independently, while sharing the same ingestion, policy, and
          audit infrastructure underneath.
        </p>
      </motion.div>

      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {pipelines.map(
          ({ id, slug, name, illustration, description }, index) => (
            <motion.div
              key={id}
              id={id}
              className="group h-full"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ ...revealTransition, delay: index * 0.12 }}
            >
              <GradientBorder
                activateOn="hover"
                className="h-full"
                contentClassName="h-full"
              >
                <Card className="h-full ring-0">
                  <CardHeader>
                    <CardTitle className="font-heading text-lg">
                      <Link
                        href={`/simulator?pipeline=${slug}`}
                        className="group/title relative inline-flex cursor-pointer items-center transition-colors duration-200 ease-out hover:text-brand-indigo-readable"
                      >
                        {name}
                        <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-brand-indigo transition-transform duration-200 ease-out group-hover/title:scale-x-100" />
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-6">
                    <p className="text-sm text-pretty text-muted-foreground">
                      {description}
                    </p>
                    <div className="mt-auto flex aspect-4/3 items-center justify-center overflow-hidden rounded-lg bg-muted/30">
                      <Image
                        src={illustration}
                        alt=""
                        width={500}
                        height={500}
                        className="size-full object-contain p-3"
                      />
                    </div>
                  </CardContent>
                </Card>
              </GradientBorder>
            </motion.div>
          ),
        )}
      </div>
    </section>
  );
}
