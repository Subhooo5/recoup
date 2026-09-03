import { formatRupees } from "@/lib/format/currency";
import { readDetailNumber } from "@/lib/format/json-detail";

export const describePolicy = (ruleType: string, config: unknown) => {
  if (ruleType === "cooldown") {
    const hours = readDetailNumber(config, "hours");

    return hours === null
      ? null
      : `A customer may not be contacted again within ${hours} hours of their last successful recovery contact, across every pipeline.`;
  }

  if (ruleType === "attempt_cap") {
    const maxActions = readDetailNumber(config, "maxActions");

    return maxActions === null
      ? null
      : `A single case may carry at most ${maxActions} recovery actions. Once it reaches that cap the gate stops allowing new ones.`;
  }

  if (ruleType === "confidence") {
    const minimumConfidence = readDetailNumber(config, "minimumConfidence");

    return minimumConfidence === null
      ? null
      : `A diagnosis below ${Math.round(minimumConfidence * 100)}% agent confidence is routed to human review instead of executing automatically.`;
  }

  if (ruleType === "amount") {
    const minimumPaise = readDetailNumber(config, "minimumPaise");

    return minimumPaise === null
      ? null
      : `Cases worth less than ${formatRupees(minimumPaise)} are not pursued, and the gate blocks every action on them.`;
  }

  if (ruleType === "retry_cap") {
    const maxAuthAttempts = readDetailNumber(config, "maxAuthAttempts");

    return maxAuthAttempts === null
      ? null
      : `Recovery contact stops once Razorpay reports ${maxAuthAttempts} authorization attempts on a subscription.`;
  }

  return null;
};
