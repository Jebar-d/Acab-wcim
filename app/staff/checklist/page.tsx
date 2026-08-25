"use client";

import * as React from "react";

import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import {
  addChecklist,
  deleteChecklist,
  toggleChecklistItem,
  useChecklists,
} from "@/lib/checklists-store";

export default function ChecklistPage() {
  const checklists = useChecklists();

  const [title, setTitle] = React.useState("");

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();

    addChecklist({
      title: title.trim() || "Construction Material Review",
    });

    setTitle("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Construction & Warehouse Checklist</CardTitle>

          <CardDescription>
            Review inventory, material availability, warehouse readiness,
            suppliers, and delivery requirements before confirming a quotation.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleAdd}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Example: Riverside Housing Material Review"
            />

            <Button type="submit">
              <Plus className="size-4" />
              Add checklist
            </Button>
          </form>
        </CardContent>
      </Card>

      {checklists.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No checklists yet.
          </CardContent>
        </Card>
      ) : (
        checklists.map((checklist) => {
          const completed = checklist.items.filter(
            (item) => item.completed,
          ).length;

          const total = checklist.items.length;

          return (
            <Card key={checklist.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <CardTitle>{checklist.title}</CardTitle>

                    <Badge
                      variant={
                        checklist.status === "Ready for Confirmation"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {checklist.status}
                    </Badge>
                  </div>

                  <CardDescription className="mt-2">
                    {completed} of {total} checks completed
                  </CardDescription>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteChecklist(checklist.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <div className="grid gap-2">
                  {checklist.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleChecklistItem(checklist.id, item.id)}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 text-left transition hover:bg-muted/50"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="size-5 shrink-0 text-primary" />
                      ) : (
                        <Circle className="size-5 shrink-0 text-muted-foreground" />
                      )}

                      <span
                        className={
                          item.completed
                            ? "text-muted-foreground line-through"
                            : ""
                        }
                      >
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
