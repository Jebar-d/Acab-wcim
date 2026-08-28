"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLedger } from "@/lib/ledger-store";

export default function LedgerPage() {
  const entries = useLedger();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ledger</CardTitle>
        <CardDescription>
          Automatically generated from purchase orders, invoices, customer
          orders, delivery receipts, and stock transactions.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No transactions yet. Transactions will appear here automatically
            when orders, deliveries, stock movements, purchase orders, or
            invoices are created.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Customer / Party</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{entry.date}</TableCell>

                    <TableCell className="font-medium">
                      {entry.reference}
                    </TableCell>

                    <TableCell>{entry.source}</TableCell>

                    <TableCell>{entry.party || "—"}</TableCell>

                    <TableCell>{entry.project || "—"}</TableCell>

                    <TableCell>{entry.description}</TableCell>

                    <TableCell>
                      {entry.amount > 0
                        ? `₱${entry.amount.toLocaleString()}`
                        : "—"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          entry.status === "Posted"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
