"use client";

import Link from "next/link";
import { Menu, Warehouse } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
];

export function CustomerProfileHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-[100] border-b border-black/10 bg-white px-6 text-black">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Warehouse className="size-4" />
          </span>
          WCIM
        </Link>

        <div className="hidden items-center gap-6 text-sm text-black/70 md:flex">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              className="transition hover:text-black"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/inquire"
            className="hidden rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 sm:inline-flex"
          >
            Request a Quote
          </Link>
          <details className="relative md:hidden">
            <summary className="flex size-9 list-none items-center justify-center rounded-2xl border border-black/15">
              <Menu className="size-4" />
            </summary>
            <div className="absolute right-0 top-11 z-50 flex w-52 flex-col gap-1 rounded-2xl border border-black/10 bg-white p-2 text-black shadow-xl">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-xl px-3 py-2 text-sm hover:bg-black/5"
                >
                  {label}
                </Link>
              ))}
              <Link
                href="/inquire"
                className="rounded-xl px-3 py-2 text-sm hover:bg-black/5"
              >
                Request a Quote
              </Link>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
