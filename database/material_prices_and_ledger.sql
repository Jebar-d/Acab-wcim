USE acab_wcim;

-- Current catalog prices. Update materials.unit_price from Staff > Inventory > Materials.
SELECT
  sku,
  name AS material,
  category,
  unit,
  unit_price AS price_per_unit,
  status
FROM materials
ORDER BY name;

-- Quotation totals are price snapshots captured when staff approves the quote.
SELECT id, project_name, customer_name, status, total_amount, created_at
FROM quotations
ORDER BY created_at DESC;

-- Orders retain the accepted quotation total, including any staff-approved edits.
SELECT order_no, project_name, client_name, status, total_amount, created_at
FROM orders
ORDER BY created_at DESC;

-- Delivery receipt values mirror the linked order and its priced line items.
SELECT dr_number, order_number, client, status, total_amount, date
FROM delivery_receipts
ORDER BY date DESC, created_at DESC;

-- Posted ledger activity with a calculated running balance, oldest first.
SELECT
  date_value AS transaction_date,
  reference,
  type AS transaction_type,
  party,
  project,
  description,
  CASE WHEN type IN ('Customer Payment', 'Other Income') THEN amount ELSE 0 END AS money_in,
  CASE WHEN type IN ('Supplier Payment', 'Operating Expense') THEN amount ELSE 0 END AS money_out,
  SUM(CASE WHEN type IN ('Customer Payment', 'Other Income') THEN amount ELSE -amount END)
    OVER (ORDER BY COALESCE(date_value, DATE(created_at)), created_at ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance,
  status
FROM ledger_entries
WHERE status = 'Posted'
ORDER BY COALESCE(date_value, DATE(created_at)), created_at;
