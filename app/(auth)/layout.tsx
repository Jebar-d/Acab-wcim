// app/(auth)/layout.tsx
import Link from "next/link";
import { Warehouse } from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background px-4 py-16 transition-colors duration-300">
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm font-semibold text-foreground"
        >
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Warehouse className="size-3.5" />
          </span>
          ACAB
        </Link>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
