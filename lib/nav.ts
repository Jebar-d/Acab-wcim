export type BreadcrumbEntry = {
  url: string;
  label: string;
  group?: string;
};

export function resolveBreadcrumb(
  pathname: string,
  entries: BreadcrumbEntry[],
): { group: string | null; label: string } {
  const match = entries.find((entry) => entry.url === pathname);
  if (match) return { group: match.group ?? null, label: match.label };

  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1];
  if (!last) return { group: null, label: "Dashboard" };

  const label = last
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return { group: null, label };
}
