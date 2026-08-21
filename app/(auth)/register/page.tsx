// app/(auth)/register/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
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
import { registerAccount, type Role } from "@/lib/auth-store";

export default function RegisterPage() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role>("user");
  const [employeeId, setEmployeeId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [submittedRole, setSubmittedRole] = React.useState<Role | null>(null);

  const needsId = role === "staff" || role === "admin";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = registerAccount({
      name,
      email,
      password,
      role,
      employeeId: needsId ? employeeId : undefined,
    });

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSubmittedRole(result.account.role);
  }

  if (submittedRole) {
    const isImmediate = submittedRole === "user";
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
              : "An existing admin will verify your ID number before you can sign in. You'll be able to log in once your account is approved."}
          </CardDescription>
        </CardHeader>
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
                Staff/employee and admin registrations are held for review. An
                existing admin verifies your ID number before your account is
                activated.
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

          {needsId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="employeeId">
                {role === "admin" ? "Admin ID number" : "Employee ID number"}
              </Label>
              <Input
                id="employeeId"
                required
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                placeholder={role === "admin" ? "ADM-0000" : "EMP-0000"}
              />
            </div>
          )}

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
