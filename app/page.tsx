import { FaqSection } from "@/components/landing/faq-section";
import { Hero } from "@/components/landing/hero";
import { PipelinesOverview } from "@/components/landing/pipelines-overview";
import { RecoveryMetrics } from "@/components/landing/recovery-metrics";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <RecoveryMetrics />
      <PipelinesOverview />
      <FaqSection />
    </>
  );
}
