"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { GetStartedButton } from "@/components/get-started-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const navigationLinks = [
  { label: "Overview", href: "/" },
  { label: "Live", href: "/live" },
  { label: "Cases", href: "/cases" },
  { label: "Simulator", href: "/simulator" },
  { label: "Audit", href: "/audit" },
];

const scrollThreshold = 48;
const navbarTransition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const };

export function Navbar() {
  const pathname = usePathname();
  const [hasScrolledPastThreshold, setHasScrolledPastThreshold] =
    useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setHasScrolledPastThreshold(window.scrollY > scrollThreshold);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLandingPage = pathname === "/";
  const isPinned = !isLandingPage || hasScrolledPastThreshold;

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4">
      <motion.div
        className="relative w-full"
        animate={{ maxWidth: isPinned ? 960 : 1200, marginTop: isPinned ? 12 : 0 }}
        transition={navbarTransition}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-[100] border border-border bg-background/70 shadow-lg shadow-black/5 backdrop-blur-md"
          animate={{ opacity: isPinned ? 1 : 0 }}
          transition={navbarTransition}
        />
        <motion.nav
          className="relative flex items-center gap-6"
          animate={{
            paddingLeft: isPinned ? 16 : 24,
            paddingRight: isPinned ? 16 : 24,
            paddingTop: isPinned ? 10 : 22,
            paddingBottom: isPinned ? 10 : 22,
          }}
          transition={navbarTransition}
        >
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-2 transition-opacity duration-200 ease-out hover:opacity-80"
          >
            <Image src="/logo-icon.svg" alt="" width={26} height={26} priority />
            <span className="font-heading text-base font-semibold tracking-tight">
              Recoup
            </span>
          </Link>

          <div className="ml-auto hidden items-center gap-6 md:flex">
            {navigationLinks.map(({ label, href }) => (
              <NavigationLink
                key={href}
                href={href}
                label={label}
                isActive={isRouteActive(pathname, href)}
              />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-3 md:ml-6">
            <ThemeToggle />
            <GetStartedButton />
          </div>
        </motion.nav>
      </motion.div>
    </header>
  );
}

function isRouteActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavigationLinkProps = {
  href: string;
  label: string;
  isActive: boolean;
};

function NavigationLink({ href, label, isActive }: NavigationLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative cursor-pointer text-sm transition-colors duration-200 ease-out",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "absolute -bottom-1 left-0 h-px w-full origin-left bg-foreground transition-transform duration-200 ease-out",
          isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
        )}
      />
    </Link>
  );
}
