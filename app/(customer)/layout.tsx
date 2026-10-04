"use client";

import Link from "next/link";
import { LogOut, Menu, Warehouse } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { NotificationsMenu } from "@/components/ui/notifications-menu";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Separator } from "@/components/ui/separator";

import { getInitials } from "@/lib/utils";
import { logout, useSession } from "@/lib/auth-store";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = useSession();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* =========================================================
          CUSTOMER HEADER
          ========================================================= */}
      <header
        className="
          sticky
          top-0
          z-[100]
          isolate
          border-b
          border-black/10
          bg-white
          px-6
          text-black
        "
      >
        <nav
          className="
            mx-auto
            flex
            h-16
            max-w-6xl
            items-center
            justify-between
          "
        >
          {/* -----------------------------------------------------
              LEFT — WCIM BRAND
              ----------------------------------------------------- */}
          <Link
            href="/"
            className="
              flex
              items-center
              gap-2
              font-semibold
              text-black
            "
          >
            <span
              className="
                flex
                size-9
                items-center
                justify-center
                rounded-2xl
                bg-primary
                text-primary-foreground
              "
            >
              <Warehouse className="size-4" />
            </span>
            WCIM
          </Link>

          {/* -----------------------------------------------------
              CENTER NAVIGATION
              ----------------------------------------------------- */}
          <div
            className="
              hidden
              items-center
              gap-6
              text-sm
              text-black/70
              md:flex
            "
          >
            <Link href="/" className="transition hover:text-black">
              Home
            </Link>

            <Link href="/materials" className="transition hover:text-black">
              Materials
            </Link>

            <Link href="/about" className="transition hover:text-black">
              About
            </Link>

            <Link href="/contact" className="transition hover:text-black">
              Contact
            </Link>

            <Link href="/faq" className="transition hover:text-black">
              FAQ
            </Link>
          </div>

          {/* -----------------------------------------------------
              RIGHT SIDE
              ----------------------------------------------------- */}
          <div className="flex items-center gap-2">
            {/* Notifications */}

            {session ? (
              <NotificationsMenu role={session.role} accountId={session.id} />
            ) : (
              /*
               * Keep the notification bell visible even when
               * logged out so the header does not visually
               * change/disappear from the landing page.
               */
              <NotificationsMenu role="user" />
            )}

            {/* ---------------------------------------------------
                USER MENU / SIGN IN
                --------------------------------------------------- */}

            {session ? (
              <Popover>
                <PopoverTrigger
                  render={
                    <button
                      type="button"
                      className="
                        hidden
                        items-center
                        gap-2
                        rounded-2xl
                        border
                        border-black/15
                        px-2
                        py-1.5
                        pr-3
                        text-sm
                        font-medium
                        text-black
                        transition
                        hover:bg-black/5
                        sm:inline-flex
                      "
                    />
                  }
                >
                  <Avatar className="size-6">
                    <AvatarFallback
                      className="
                        rounded-full
                        bg-primary
                        text-[11px]
                        font-medium
                        text-primary-foreground
                      "
                    >
                      {getInitials(session.name)}
                    </AvatarFallback>
                  </Avatar>

                  <span className="max-w-[10rem] truncate">{session.name}</span>
                </PopoverTrigger>

                <PopoverContent align="end" className="w-64 gap-1 p-2">
                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      px-2
                      py-1.5
                    "
                  >
                    <Avatar className="size-9 shrink-0">
                      <AvatarFallback
                        className="
                          rounded-full
                          bg-primary
                          text-sm
                          font-medium
                          text-primary-foreground
                        "
                      >
                        {getInitials(session.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div
                      className="
                        grid
                        flex-1
                        text-left
                        leading-tight
                      "
                    >
                      <span
                        className="
                          truncate
                          text-sm
                          font-semibold
                        "
                      >
                        {session.name}
                      </span>

                      <span
                        className="
                          truncate
                          text-xs
                          text-muted-foreground
                        "
                      >
                        {session.email}
                      </span>
                    </div>
                  </div>

                  <Separator className="my-1.5" />

                  <Link
                    href="/profile"
                    className="flex items-center rounded-xl px-2 py-2 text-sm font-medium transition hover:bg-black/5"
                  >
                    Profile & activity
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      group/item
                      flex
                      w-full
                      items-center
                      gap-2.5
                      rounded-2xl
                      px-2
                      py-2
                      text-sm
                      font-medium
                      text-destructive
                      transition-colors
                      hover:bg-destructive/10
                    "
                  >
                    <LogOut
                      className="
                        size-4
                        transition-transform
                        duration-200
                        group-hover/item:translate-x-0.5
                      "
                    />
                    Log out
                  </button>
                </PopoverContent>
              </Popover>
            ) : (
              <Link
                href="/login"
                className="
                  hidden
                  rounded-2xl
                  border
                  border-black/15
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-black
                  transition
                  hover:bg-black/5
                  sm:inline-flex
                "
              >
                Sign In
              </Link>
            )}

            {/* Request quote */}

            <Link
              href="/inquire"
              className="
                hidden
                rounded-2xl
                bg-primary
                px-3
                py-2
                text-sm
                font-medium
                text-primary-foreground
                transition
                hover:bg-primary/85
                sm:inline-flex
              "
            >
              Request a Quote
            </Link>

            {/* ---------------------------------------------------
                MOBILE MENU
                --------------------------------------------------- */}

            <details className="relative sm:hidden">
              <summary
                className="
                  flex
                  size-9
                  list-none
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-black/15
                "
              >
                <Menu className="size-4" />
              </summary>

              <div
                className="
                  absolute
                  right-0
                  top-11
                  z-50
                  flex
                  w-52
                  flex-col
                  gap-1
                  rounded-2xl
                  border
                  border-black/10
                  bg-white
                  p-2
                  text-black
                  shadow-xl
                "
              >
                <Link
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    hover:bg-black/5
                  "
                  href="/"
                >
                  Home
                </Link>

                <Link
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    hover:bg-black/5
                  "
                  href="/materials"
                >
                  Materials
                </Link>

                <Link
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    hover:bg-black/5
                  "
                  href="/about"
                >
                  About
                </Link>

                <Link
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    hover:bg-black/5
                  "
                  href="/contact"
                >
                  Contact
                </Link>

                <Link
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    hover:bg-black/5
                  "
                  href="/faq"
                >
                  FAQ
                </Link>

                <Link
                  className="
                    rounded-xl
                    px-3
                    py-2
                    text-sm
                    hover:bg-black/5
                  "
                  href="/inquire"
                >
                  Request a Quote
                </Link>

                {session ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="
                      rounded-xl
                      px-3
                      py-2
                      text-left
                      text-sm
                      text-destructive
                      hover:bg-destructive/10
                    "
                  >
                    Log out ({session.name})
                  </button>
                ) : (
                  <Link
                    className="
                      rounded-xl
                      px-3
                      py-2
                      text-sm
                      hover:bg-black/5
                    "
                    href="/login"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </details>
          </div>
        </nav>
      </header>

      <main className="relative z-0">{children}</main>

      {/* =========================================================
          FOOTER
          LEFT UNCHANGED FOR NOW
          ========================================================= */}
      <footer
        className="
          border-t
          border-border
          bg-[#0e0e0d]
          px-6
          py-14
          text-white
        "
      >
        <div
          className="
            mx-auto
            grid
            max-w-6xl
            gap-10
            md:grid-cols-[1.3fr_1fr_1fr_1fr]
          "
        >
          <div>
            <Link
              href="/"
              className="
                flex
                items-center
                gap-2
                font-semibold
              "
            >
              <span
                className="
                  flex
                  size-9
                  items-center
                  justify-center
                  rounded-2xl
                  bg-primary
                  text-primary-foreground
                "
              >
                <Warehouse className="size-4" />
              </span>
              WCIM
            </Link>

            <p
              className="
                mt-3
                max-w-xs
                text-sm
                leading-6
                text-white/60
              "
            >
              Warehouse construction inventory management — from customer
              inquiry to delivery, kept organized.
            </p>
          </div>

          <div
            className="
              flex
              flex-col
              gap-2
              text-sm
              text-white/70
            "
          >
            <p
              className="
                mb-1
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-white/40
              "
            >
              Company
            </p>

            <Link href="/about">About</Link>

            <Link href="/materials">Materials</Link>

            <Link href="/faq">FAQ</Link>
          </div>

          <div
            className="
              flex
              flex-col
              gap-2
              text-sm
              text-white/70
            "
          >
            <p
              className="
                mb-1
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-white/40
              "
            >
              Get started
            </p>

            <Link href="/inquire">Request a Quote</Link>

            <Link href="/contact">Contact</Link>

            {session ? (
              <Link href="/">{session.name}</Link>
            ) : (
              <Link href="/login">Sign In</Link>
            )}
          </div>

          <div
            className="
              flex
              flex-col
              gap-2
              text-sm
              text-white/70
            "
          >
            <p
              className="
                mb-1
                text-xs
                font-semibold
                uppercase
                tracking-[0.14em]
                text-white/40
              "
            >
              Contact
            </p>

            <span>hello@wcim.app</span>

            <span>Mon–Sat, 8am–6pm</span>
          </div>
        </div>

        <p
          className="
            mx-auto
            mt-10
            max-w-6xl
            text-xs
            text-white/40
          "
        >
          © 2026 WCIM. All rights reserved.
        </p>
      </footer>

      <Toaster />
    </div>
  );
}
