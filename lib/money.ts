export function formatMoney(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

export function formatUnitPrice(value: number | null | undefined): string {
  const amount = Number(value);
  return !Number.isFinite(amount) || amount <= 0 ? "Price not set" : formatMoney(amount);
}
