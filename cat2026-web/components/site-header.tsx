import Link from "next/link";
import { SignOutButton } from "@/components/sign-out-button";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/progress", label: "Progress" },
  { href: "/archive", label: "Archive" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-6">
        <Link
          href="/"
          className="wordmark inline-flex items-center gap-3 transition-opacity duration-150 hover:opacity-90"
          aria-label="Puzzle Time home"
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent-glow)]"
          />
          <span>Puzzle Time</span>
        </Link>

        <div className="flex items-center gap-4">
          <nav
            className="hidden items-center gap-1 rounded-[var(--r-lg)] border border-[var(--border-faint)] bg-[var(--bg-raised)] p-1 sm:flex"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="nav-link">
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden h-6 w-px bg-[var(--border-faint)] sm:block" />

          {/* <div className="shrink-0">
            <SignOutButton />
          </div> */}
        </div>
      </div>
    </header>
  );
}
