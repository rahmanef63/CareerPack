import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { AdminPanel } from "@/slices/admin-panel";

export default function AdminPage() {
  return (
    <RouteGuard mode="role" requiredRole="admin">
      <AdminPanel />
    </RouteGuard>
  );
}
