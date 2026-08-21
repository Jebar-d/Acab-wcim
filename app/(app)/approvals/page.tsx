// app/(app)/approvals/page.tsx
"use client";

import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getInitials } from "@/lib/utils";
import {
  reviewAccount,
  useAccounts,
  useSession,
  type Account,
} from "@/lib/auth-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleBadge({ role }: { role: Account["role"] }) {
  return (
    <Badge
      variant={role === "admin" ? "default" : "secondary"}
      className="capitalize"
    >
      {role}
    </Badge>
  );
}

export default function ApprovalsPage() {
  const accounts = useAccounts();
  const session = useSession();
  const isAdmin = session?.role === "admin";

  const pending = accounts
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const reviewed = accounts
    .filter((a) => a.role !== "user" && a.reviewedAt)
    .sort((a, b) => (b.reviewedAt ?? "").localeCompare(a.reviewedAt ?? ""))
    .slice(0, 8);

  function handleReview(id: string, decision: "approve" | "reject") {
    reviewAccount(id, decision, session?.name ?? "Admin");
  }

  if (!isAdmin) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-muted-foreground" />
            Admins only
          </CardTitle>
          <CardDescription>
            Sign in with an admin account to review pending staff/employee and
            admin registrations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            render={<a href="/login">Go to sign in</a>}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending registrations</CardTitle>
          <CardDescription>
            Staff/employee and admin sign-ups wait here until a verified admin
            confirms their ID number.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {pending.length === 0 && (
            <Alert>
              <AlertDescription>
                Nothing waiting on review right now.
              </AlertDescription>
            </Alert>
          )}

          {pending.map((account) => (
            <div
              key={account.id}
              className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                  {getInitials(account.name)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{account.name}</p>
                    <RoleBadge role={account.role} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {account.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    ID number:{" "}
                    <span className="font-mono font-medium text-foreground">
                      {account.employeeId}
                    </span>{" "}
                    · Submitted {formatDate(account.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleReview(account.id, "reject")}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <XCircle className="size-4" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReview(account.id, "approve")}
                >
                  <CheckCircle2 className="size-4" />
                  Approve
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {reviewed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently reviewed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {reviewed.map((account) => (
              <div
                key={account.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl px-3 py-2 text-sm transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{account.name}</span>
                  <RoleBadge role={account.role} />
                  <span className="text-xs text-muted-foreground">
                    {account.employeeId}
                  </span>
                </div>
                <Badge
                  variant={
                    account.status === "active" ? "secondary" : "destructive"
                  }
                  className="capitalize"
                >
                  {account.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
