"use client";

import * as React from "react";
import { Printer, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DeliveryReceipt } from "@/lib/delivery-receipts-store";

/** "DEN GEBHARD, 100 San Ricardo St, ..., Pinagbuhatan, Pasig, Metro manila, 1602" -> "Pinagbuhatan, Pasig, Metro manila" */
export function shortAddress(address?: string | null): string {
  if (!address) return "";
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length && /^\d{4,}$/.test(parts[parts.length - 1])) parts.pop();
  if (parts.length > 3) parts.shift();
  return parts.slice(-3).join(", ");
}

function formatReceiptDate(date: string) {
  const parsed = new Date(date.length <= 10 ? `${date}T00:00:00` : date);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

/* Styles live in one string so the on-screen receipt and the printed copy look identical. */
const RECEIPT_CSS = `
.dr-paper{background:#fff;color:#111;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:32px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,.2);position:relative;font-size:14px;line-height:1.45}
.dr-paper *{box-sizing:border-box}
.dr-head{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #111;padding-bottom:16px}
.dr-brand{font-size:22px;font-weight:800;letter-spacing:.04em}
.dr-sub{font-size:12px;color:#555;margin-top:2px}
.dr-title{text-align:right}
.dr-title h2{margin:0;font-size:18px;font-weight:800;letter-spacing:.12em}
.dr-no{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:15px;font-weight:700;margin-top:4px}
.dr-meta{display:grid;grid-template-columns:1fr 1fr;gap:14px 28px;margin:20px 0}
.dr-label{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#666}
.dr-value{font-size:14px;margin-top:2px;word-break:break-word}
.dr-full{grid-column:1 / -1}
.dr-table{width:100%;border-collapse:collapse;margin-top:6px}
.dr-table th{font-size:10px;letter-spacing:.12em;text-transform:uppercase;text-align:left;color:#666;border-bottom:1px solid #111;padding:8px 6px}
.dr-table td{padding:10px 6px;border-bottom:1px dashed #bbb;vertical-align:top}
.dr-table .dr-num{text-align:right;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:nowrap}
.dr-items{margin:0;padding:0;list-style:none}
.dr-total td{border-bottom:2px solid #111;font-weight:700}
.dr-stamp{position:absolute;right:36px;top:104px;border:3px solid #15803d;color:#15803d;padding:2px 12px;border-radius:6px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;transform:rotate(-10deg);opacity:.8;font-size:16px}
.dr-stamp.draft{border-color:#999;color:#777}
.dr-stamp.released{border-color:#b45309;color:#b45309}
.dr-sign{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:48px}
.dr-line{border-top:1px solid #111;padding-top:6px;font-size:12px;color:#444}
.dr-line strong{display:block;color:#111;font-size:13px}
.dr-note{margin-top:24px;font-size:11px;color:#666;text-align:center;border-top:1px dashed #bbb;padding-top:12px}
@media (max-width:560px){.dr-paper{padding:20px}.dr-head{flex-direction:column}.dr-title{text-align:left}.dr-meta{grid-template-columns:1fr}.dr-sign{grid-template-columns:1fr;gap:28px}.dr-stamp{position:static;display:inline-block;margin-top:12px;transform:none}}
`;

function printReceipt(element: HTMLElement, title: string) {
  const frame = document.createElement("iframe");
  frame.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc || !frame.contentWindow) {
    frame.remove();
    return;
  }
  doc.open();
  doc.write(
    `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>${RECEIPT_CSS}@page{margin:12mm}body{margin:0;background:#fff}.dr-paper{box-shadow:none}</style></head><body>${element.outerHTML}</body></html>`,
  );
  doc.close();
  window.setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    window.setTimeout(() => frame.remove(), 1000);
  }, 250);
}

export function DeliveryReceiptDocument({
  receipt,
  innerRef,
}: {
  receipt: DeliveryReceipt;
  innerRef?: React.Ref<HTMLDivElement>;
}) {
  const lines = receipt.items
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const stampClass =
    receipt.status === "Delivered"
      ? ""
      : receipt.status === "Released"
        ? "released"
        : "draft";

  return (
    <div className="dr-paper" ref={innerRef}>
      <div className="dr-head">
        <div>
          <div className="dr-brand">ACAB WCIM</div>
          <div className="dr-sub">
            Warehouse Construction Inventory Management
          </div>
        </div>
        <div className="dr-title">
          <h2>DELIVERY RECEIPT</h2>
          <div className="dr-no">{receipt.drNumber}</div>
        </div>
      </div>

      <div className={`dr-stamp ${stampClass}`}>{receipt.status}</div>

      <div className="dr-meta">
        <div>
          <div className="dr-label">Order no.</div>
          <div className="dr-value">{receipt.orderNumber}</div>
        </div>
        <div>
          <div className="dr-label">Date</div>
          <div className="dr-value">{formatReceiptDate(receipt.date)}</div>
        </div>
        <div>
          <div className="dr-label">Client</div>
          <div className="dr-value">{receipt.client}</div>
        </div>
        <div>
          <div className="dr-label">Delivery / Payment</div>
          <div className="dr-value">
            {[receipt.deliveryMethod, receipt.paymentMethod]
              .filter(Boolean)
              .join(" · ") || "—"}
          </div>
        </div>
        <div className="dr-full">
          <div className="dr-label">Deliver to</div>
          <div className="dr-value">{receipt.deliveryAddress || "—"}</div>
        </div>
      </div>

      <table className="dr-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>SKU</th>
            <th className="dr-num">Qty</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <ul className="dr-items">
                {lines.length ? (
                  lines.map((line, index) => (
                    <li key={`${line}-${index}`}>{line}</li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </td>
            <td>{receipt.sku || "—"}</td>
            <td className="dr-num">{receipt.quantity}</td>
          </tr>
          <tr className="dr-total">
            <td colSpan={2}>Total quantity</td>
            <td className="dr-num">{receipt.quantity}</td>
          </tr>
        </tbody>
      </table>

      <div className="dr-sign">
        <div className="dr-line">
          <strong>{receipt.releasedBy || "—"}</strong>
          Released by
        </div>
        <div className="dr-line">
          <strong>&nbsp;</strong>
          Received by (signature over printed name)
        </div>
      </div>

      <div className="dr-note">
        Please check the goods upon delivery. Report any shortage or damage
        within 24 hours.
      </div>
    </div>
  );
}

export function DeliveryReceiptDialog({
  receipt,
  trigger,
}: {
  receipt: DeliveryReceipt;
  /** Render your own opener; call `open()` on click. Defaults to a "View receipt" button. */
  trigger?: (open: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const paperRef = React.useRef<HTMLDivElement>(null);

  return (
    <>
      {trigger ? (
        trigger(() => setOpen(true))
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Receipt className="size-4" />
          View receipt
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92vh] gap-4 overflow-y-auto p-4 sm:max-w-3xl">
          <DialogTitle className="sr-only">
            Delivery receipt {receipt.drNumber}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Printable delivery receipt for order {receipt.orderNumber}.
          </DialogDescription>
          <style>{RECEIPT_CSS}</style>
          <DeliveryReceiptDocument receipt={receipt} innerRef={paperRef} />
          <div className="flex justify-end">
            <Button
              onClick={() => {
                if (paperRef.current)
                  printReceipt(
                    paperRef.current,
                    `Delivery Receipt ${receipt.drNumber}`,
                  );
              }}
            >
              <Printer className="size-4" />
              Print / Save as PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
