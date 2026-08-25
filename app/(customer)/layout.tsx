import Link from "next/link";
import { Menu, Warehouse } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 px-6 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Warehouse className="size-4" />
            </span>
            WCIM
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/">Home</Link>
            <Link href="/#materials">Materials</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-2xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted sm:inline-flex"
            >
              Sign In
            </Link>
            <Link
              href="/inquire"
              className="hidden rounded-2xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/85 sm:inline-flex"
            >
              Request a Quote
            </Link>
            <details className="relative sm:hidden">
              <summary className="flex size-9 list-none items-center justify-center rounded-2xl border border-border">
                <Menu className="size-4" />
              </summary>
              <div className="absolute right-0 top-11 z-50 flex w-52 flex-col gap-1 rounded-2xl border border-border bg-background p-2 shadow-xl">
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/"
                >
                  Home
                </Link>
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/#materials"
                >
                  Materials
                </Link>
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/about"
                >
                  About
                </Link>
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/contact"
                >
                  Contact
                </Link>
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/faq"
                >
                  FAQ
                </Link>
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/inquire"
                >
                  Request a Quote
                </Link>
                <Link
                  className="rounded-xl px-3 py-2 text-sm hover:bg-muted"
                  href="/login"
                >
                  Sign In
                </Link>
              </div>
            </details>
          </div>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-8 text-sm text-muted-foreground md:flex-row">
          <div>
            <p className="font-semibold text-foreground">WCIM</p>
            <p className="mt-1">Warehouse Construction Inventory Management</p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/#materials">Materials</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/inquire">Request a Quote</Link>
            <Link href="/login">Sign In</Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-muted-foreground">
          © 2026 WCIM
        </p>
      </footer>
      <Toaster />
    </div>
  );
}
