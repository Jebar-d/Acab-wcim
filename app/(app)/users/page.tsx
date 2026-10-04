// app/(app)/users/page.tsx (full file)
"use client";

import * as React from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getInitials } from "@/lib/utils";
import {
  deleteAccount,
  reviewAccount,
  useAccounts,
  useSession,
  type Account,
  type Role,
} from "@/lib/auth-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge
      variant={role === "admin" ? "default" : "secondary"}
      className="capitalize"
    >
      {role}
    </Badge>
  );
}

function StatusBadge({ status }: { status: Account["status"] }) {
  return (
    <Badge
      variant={
        status === "active"
          ? "secondary"
          : status === "pending"
            ? "outline"
            : "destructive"
      }
      className="capitalize"
    >
      {status}
    </Badge>
  );
}

const FILTERS: { label: string; value: Role | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Users", value: "user" },
  { label: "Staff", value: "staff" },
  { label: "Admins", value: "admin" },
];

export default function UsersPage() {
  const accounts = useAccounts();
  const session = useSession();
  const isAdmin = session?.role === "admin";
  const [filter, setFilter] = React.useState<Role | "all">("all");

  const pending = accounts
    .filter((a) => a.status === "pending")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const directory = accounts
    .filter((a) => a.status !== "pending")
    .filter((a) => filter === "all" || a.role === filter)
    .sort((a, b) => a.name.localeCompare(b.name));

  async function handleReview(account: Account, decision: "approve" | "reject") {
    await reviewAccount(account.id, decision, session?.name ?? "Admin");
    toast(
      decision === "approve"
        ? `${account.name} approved`
        : `${account.name}'s registration rejected`,
    );
  }

  async function handleRevoke(account: Account) {
    await reviewAccount(account.id, "reject", session?.name ?? "Admin");
    toast(`${account.name}'s access revoked`);
  }

  async function handleReinstate(account: Account) {
    await reviewAccount(account.id, "approve", session?.name ?? "Admin");
    toast(`${account.name} reinstated`);
  }

  async function handleDelete(account: Account) {
    await deleteAccount(account.id);
    toast(`${account.name} deleted`);
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
            Sign in with an admin account to manage users and registrations.
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
      {pending.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending registrations</CardTitle>
            <CardDescription>
              Staff/employee and admin sign-ups wait here until a verified admin
              confirms their ID number.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pending.map((account) => (
              <div
                key={account.id}
                className="flex flex-col gap-3 rounded-3xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(account.name)}
                    </AvatarFallback>
                  </Avatar>
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
                    onClick={() => handleReview(account, "reject")}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview(account, "approve")}
                  >
                    <CheckCircle2 className="size-4" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Users</CardTitle>
            <CardDescription>Everyone with access to ACAB.</CardDescription>
          </div>
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as Role | "all")}
          >
            <TabsList>
              {FILTERS.map((option) => (
                <TabsTrigger key={option.value} value={option.value}>
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          {directory.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No accounts in this view yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {directory.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                            {getInitials(account.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{account.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {account.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={account.role} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={account.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {account.employeeId ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {account.status === "active" &&
                        account.id !== session?.id && (
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                >
                                  Revoke
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Revoke {account.name}&apos;s access?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  They&apos;ll immediately lose {account.role}{" "}
                                  access. You can reinstate them from this same
                                  page afterward.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleRevoke(account)}
                                  className="bg-destructive text-white hover:bg-destructive/90"
                                >
                                  Revoke access
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      {account.status === "rejected" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReinstate(account)}
                        >
                          Reinstate
                        </Button>
                      )}
                      {account.id !== session?.id && (
                        <AlertDialog>
                          <AlertDialogTrigger render={<Button size="sm" variant="ghost" className="text-destructive">Delete</Button>} />
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {account.name}&apos;s account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This permanently removes the account and its login access. A deletion notice is recorded for staff/admin.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => void handleDelete(account)} className="bg-destructive text-white hover:bg-destructive/90">Delete account</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
