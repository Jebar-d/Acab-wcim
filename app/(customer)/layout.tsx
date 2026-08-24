import Link from "next/link";
import { Warehouse } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 px-6 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Warehouse className="size-4" />
            </span>
            ACAB
          </Link>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href="/">Home</Link>
            <Link href="/about">About</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/inquire">Order</Link>
          </div>
          <Link
            href="/login"
            className="rounded-2xl border border-border px-3 py-2 text-sm font-medium transition hover:bg-muted"
          >
            Sign in
          </Link>
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-sm text-muted-foreground md:flex-row">
          <span>ACAB Warehouse Construction IMS</span>
          <span>Materials, movement, and momentum.</span>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}
