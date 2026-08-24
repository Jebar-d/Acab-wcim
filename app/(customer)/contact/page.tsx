"use client";

import { useState } from "react";
import { toast } from "sonner";
import LinkPreview from "@/components/originkit/ui/link-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1fr_1.2fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Contact
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">
          Let&apos;s move the work forward.
        </h1>
        <p className="mt-5 text-muted-foreground">
          Reach us at{" "}
          <LinkPreview
            title="hello@acab.com"
            link="mailto:hello@acab.com"
            imageMode="custom"
            customImage={{ src: "/originkit/hero-20/building.png" }}
            previewWidth={240}
            previewHeight={140}
            radius={16}
            shadow
            shadowColor="rgba(0,0,0,.2)"
            textColor="currentColor"
            underlineColor="currentColor"
            font={{}}
          />
          .
        </p>
      </div>
      <form
        className="flex flex-col gap-4 rounded-2xl border border-border p-6"
        onSubmit={(event) => {
          event.preventDefault();
          setSent(true);
          toast.success("Message sent");
        }}
      >
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required className="mt-1.5" />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <textarea
            id="message"
            required
            className="mt-1.5 min-h-32 w-full rounded-2xl border border-input bg-transparent p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {sent && (
          <Alert>
            <AlertDescription>
              Thanks. We&apos;ll be in touch shortly.
            </AlertDescription>
          </Alert>
        )}
        <Button type="submit">Send message</Button>
      </form>
    </div>
  );
}
