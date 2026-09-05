"use client";

import { motion } from "motion/react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const revealTransition = { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const };

const questions = [
  {
    id: "what-it-does",
    question: "What does Recoup actually do?",
    answer:
      "It watches for payments, checkouts, and subscriptions that are about to lose you money, figures out why, and tries to win the sale back automatically.",
  },
  {
    id: "real-money",
    question: "Is this connected to real money?",
    answer:
      "It runs on Razorpay's test mode, so every action is real infrastructure; just no real cash changes hands.",
  },
  {
    id: "real-email",
    question: "Will it actually email customers?",
    answer:
      "Yes, every recovery action that gets approved sends a real email, using a real Razorpay payment link.",
  },
  {
    id: "no-spam",
    question: "What stops it from spamming someone?",
    answer:
      "A set of rules: Cooldowns, Spend limits, and Confidence checks - block or hold any action before it reaches a customer. You can see exactly which rule fired for every case on the Audit page.",
  },
  {
    id: "try-it",
    question: "Can I try it myself?",
    answer:
      "Yes, head to the Simulator, pick a scenario, and watch the full detect, diagnose, decide, execute loop run in real time.",
  },
];

export function FaqSection() {
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
          FAQ
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ ...revealTransition, delay: 0.12 }}
        className="mx-auto mt-12 max-w-3xl"
      >
        <Accordion type="single" collapsible className="border-t border-border">
          {questions.map(({ id, question, answer }) => (
            <AccordionItem
              key={id}
              value={id}
              className="border-b border-border not-last:border-b"
            >
              <AccordionTrigger className="cursor-pointer py-5 font-heading text-base font-medium tracking-tight no-underline transition-colors duration-200 ease-out hover:no-underline aria-expanded:text-brand-indigo-readable **:data-[slot=accordion-trigger-icon]:size-5 aria-expanded:**:data-[slot=accordion-trigger-icon]:text-brand-indigo sm:text-lg">
                {question}
              </AccordionTrigger>
              <AccordionContent className="max-w-2xl pb-5 text-sm text-pretty text-muted-foreground sm:text-base">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
