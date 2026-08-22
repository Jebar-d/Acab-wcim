const staffMetrics = [
  { label: "Assigned Orders", value: "0" },
  { label: "Items to Pick", value: "0" },
  { label: "Pending Deliveries", value: "0" },
  { label: "Low Stock Items", value: "0" },
];

const staffAreas = [
  {
    title: "Sales",
    description: "Clients, quotations, and orders",
    links: [
      ["Clients", "/staff/clients"],
      ["Quotations", "/staff/quotations"],
      ["Orders", "/staff/orders"],
    ],
  },
  {
    title: "Inventory",
    description: "Materials, categories, and checklist",
    links: [
      ["Materials", "/staff/materials"],
      ["Categories", "/staff/categories"],
      ["Checklist", "/staff/checklist"],
    ],
  },
  {
    title: "Warehouse",
    description: "Stock movements and delivery receipts",
    links: [
      ["Stock In", "/staff/stock-in"],
      ["Stock Out", "/staff/stock-out"],
      ["Delivery Receipts", "/staff/delivery-receipts"],
    ],
  },
  {
    title: "Procurement",
    description: "Purchase orders, suppliers, and ledger",
    links: [
      ["Purchase Orders", "/staff/purchase-orders"],
      ["Suppliers", "/staff/suppliers"],
      ["Ledger", "/staff/ledger"],
    ],
  },
];

export default function StaffPage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Staff Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Keep today&apos;s warehouse work moving.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {staffMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="font-semibold">Today&apos;s work</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Assigned orders, stock movements, and delivery tasks will appear here.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {staffAreas.map((area) => (
          <section key={area.title} className="rounded-lg border border-border bg-card p-5">
            <h2 className="font-semibold">{area.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{area.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {area.links.map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-md border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {label}
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
