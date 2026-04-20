import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { AdminDashboard } from "@/slices/admin";

export default function AdminPage() {
  return (
    <RouteGuard mode="role" requiredRole="admin">
      <AdminDashboard />
    </RouteGuard>
  );
}
