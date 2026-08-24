// app/(auth)/register/page.tsx (full file)
"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, UserPlus, Warehouse } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RoleSelect } from "@/components/auth/role-select";
import { registerAccount, type Account, type Role } from "@/lib/auth-store";

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("user");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submittedAccount, setSubmittedAccount] =
    React.useState<Account | null>(null);

  const needsId = role === "staff" || role === "admin";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = registerAccount({ name, email, password, role });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSubmittedAccount(result.account);

    if (result.account.employeeId) {
      toast.success(
        `Your ${result.account.role} ID is ${result.account.employeeId}`,
        {
          description:
            "Keep this — an admin will ask for it to verify your registration.",
        },
      );
    } else {
      toast.success("Account created — you can sign in now.");
    }
  }

  if (submittedAccount) {
    const isImmediate = submittedAccount.role === "user";
    return (
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="size-6" />
          </div>
          <CardTitle className="text-xl">
            {isImmediate ? "Account created" : "Registration submitted"}
          </CardTitle>
          <CardDescription>
            {isImmediate
              ? "You can sign in right away."
              : "An existing admin will verify your ID before you can sign in."}
          </CardDescription>
        </CardHeader>

        {submittedAccount.employeeId && (
          <CardContent>
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-3 text-center">
              <span className="text-xs text-muted-foreground">
                Your {submittedAccount.role === "admin" ? "admin" : "employee"}{" "}
                ID
              </span>
              <span className="font-mono text-lg font-semibold tracking-wide">
                {submittedAccount.employeeId}
              </span>
            </div>
          </CardContent>
        )}

        <CardFooter className="justify-center pt-0">
          <Button render={<Link href="/login">Go to sign in</Link>} />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="items-center text-center">
        <div className="mb-1 flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Warehouse className="size-5" />
        </div>
        <CardTitle className="text-xl">Create an account</CardTitle>
        <CardDescription>Register for ACAB access</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Account type</Label>
            <RoleSelect value={role} onChange={setRole} />
          </div>

          {needsId && (
            <Alert>
              <AlertDescription>
                We&apos;ll generate your{" "}
                {role === "admin" ? "admin" : "employee"} ID automatically once
                you register. An existing admin verifies it before your account
                is activated.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Juan Dela Cruz"
              autoComplete="name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@acab.com"
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-1">
            <UserPlus className="size-4" />
            {submitting ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
