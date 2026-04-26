import { RouteGuard } from "@/shared/components/auth/RouteGuard";
import { LoginPage } from "@/slices/auth";

export default function LoginRoute() {
  return (
    <RouteGuard mode="guest">
      <LoginPage />
    </RouteGuard>
  );
}
