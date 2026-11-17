"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  { href: "/#track", label: "Track a parcel" },
  { href: "/shipments/new", label: "Send a parcel" },
  { href: "/staff/sign-in", label: "Staff" },
];

export function AppHeaderFallback() {
  return (
    <>
      <a
        href="#main-content"
        className="rounded-control bg-card text-foreground focus:ring-ring sr-only z-50 px-4 py-3 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-2"
      >
        Skip to content
      </a>
      <header className="border-border bg-card/90 border-b">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="rounded-control text-foreground flex min-h-11 items-center gap-3 font-semibold"
          >
            <span>Parcel delivery</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex flex-wrap items-center gap-2"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-control hover:bg-muted text-muted-foreground min-h-11 px-4 py-2 text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
    </>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <>
      <a
        href="#main-content"
        className="rounded-control bg-card text-foreground focus:ring-ring sr-only z-50 px-4 py-3 focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:ring-2"
      >
        Skip to content
      </a>
      <header className="border-border bg-card/90 border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="rounded-control text-foreground focus-visible:outline-ring flex min-h-11 items-center gap-3 font-semibold focus-visible:outline-2"
          >
            <span>Parcel delivery</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-2 md:flex"
          >
            {links.map((link) => {
              const active =
                (link.href === "/shipments/new" &&
                  pathname.startsWith("/shipments")) ||
                (link.href === "/staff/sign-in" &&
                  pathname.startsWith("/staff"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-control hover:bg-muted focus-visible:outline-ring min-h-11 px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-control border-border min-h-11 border px-4 text-sm font-medium md:hidden"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>
        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="border-border grid gap-1 border-t px-4 py-3 md:hidden"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-control text-foreground hover:bg-muted focus-visible:outline-ring flex min-h-11 items-center px-3 focus-visible:outline-2"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
