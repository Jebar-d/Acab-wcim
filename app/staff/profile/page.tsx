// app/staff/profile/page.tsx (new file)
import { Suspense } from "react";
import { ProfileView } from "@/components/profile/profile-view";

export default function StaffProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-64" aria-busy="true" />}>
      <ProfileView />
    </Suspense>
  );
}
