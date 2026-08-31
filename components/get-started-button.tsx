import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GetStartedButtonProps = {
  className?: string;
};

export function GetStartedButton({ className }: GetStartedButtonProps) {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "cursor-pointer bg-black px-4 text-white transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-black dark:bg-linear-to-r dark:from-brand-indigo dark:to-brand-emerald dark:text-white dark:hover:brightness-110",
        className,
      )}
    >
      <Link href="/simulator">Get Started</Link>
    </Button>
  );
}
