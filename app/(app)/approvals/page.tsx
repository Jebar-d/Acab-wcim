import { redirect } from "next/navigation";

// Pending review is now part of the unified /users page.
export default function ApprovalsPage() {
  redirect("/users");
}
