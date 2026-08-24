// components/profile/profile-view.tsx (new file)
"use client";

import { CalendarDays, IdCard, Mail, ShieldCheck } from "lucide-react";

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
import { Separator } from "@/components/ui/separator";
import { getInitials } from "@/lib/utils";
import { useSession, type Role } from "@/lib/auth-store";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
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

/** Shared by /profile (admin) and /staff/profile — reads whoever's signed in. */
export function ProfileView() {
  const session = useSession();

  if (!session) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>You&apos;re not signed in</CardTitle>
          <CardDescription>Sign in to view your profile.</CardDescription>
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
    <Card className="max-w-xl">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar className="size-16">
          <AvatarFallback className="rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {getInitials(session.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-xl">{session.name}</CardTitle>
            <RoleBadge role={session.role} />
          </div>
          <CardDescription>{session.email}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <Separator />

        <div className="flex items-center gap-3 text-sm">
          <Mail className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Email</span>
          <span className="ml-auto font-medium">{session.email}</span>
        </div>

        {session.employeeId && (
          <div className="flex items-center gap-3 text-sm">
            <IdCard className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {session.role === "admin" ? "Admin ID" : "Employee ID"}
            </span>
            <span className="ml-auto font-mono font-medium">
              {session.employeeId}
            </span>
          </div>
        )}

        <div className="flex items-center gap-3 text-sm">
          <ShieldCheck className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Access level</span>
          <span className="ml-auto">
            <RoleBadge role={session.role} />
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <CalendarDays className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">Member since</span>
          <span className="ml-auto font-medium">
            {formatDate(session.createdAt)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
