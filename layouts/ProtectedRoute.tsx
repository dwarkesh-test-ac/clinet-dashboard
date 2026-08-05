import { ProtectedRoute as SharedProtectedRoute } from "@navyug/core";
import { useAuthStore } from "../stores/authStore";
import { routes } from "../config/routes";

/** App-specific wiring: supplies this app's auth store + login route to the shared guard. */
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return <SharedProtectedRoute isAuthenticated={isAuthenticated} loginPath={routes.login} />;
}
