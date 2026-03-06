import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

type RequireRole = "PLAYER" | "ADMIN" | "SUPERADMIN";
const SYSTEM_SLUG = "esportm-system";

export default function RoleRoute({
  require,
  systemSlug = SYSTEM_SLUG,
}: {
  require: RequireRole;
  systemSlug?: string;
}) {
  const { user, token, isLoading } = useAuth();
  const location = useLocation();

  // ✅ wait for refreshMe() on first load
  if (isLoading) return null;

  // ✅ not logged in
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // const memberships: any[] = (user as any)?.memberships ?? [];

  // const isPlayer = memberships.some((m) => m?.primary === "PLAYER");
  // const isAdmin = memberships.some((m) => m?.primary === "ADMIN");
  // const isSuperAdmin = memberships.some(
  //   (m) => m?.primary === "ADMIN" && m?.club?.slug === systemSlug
  // );

  const memberships = user?.memberships ?? [];
const hasMembership = memberships.length > 0;

const isPlayer =
  !hasMembership || memberships.some((m: any) => m?.primary === "PLAYER");

const isAdmin = memberships.some((m: any) => m?.primary === "ADMIN");

const isSuperAdmin = memberships.some(
  (m: any) => m?.primary === "ADMIN" && m?.club?.slug === systemSlug
);


  const allowed =
    require === "PLAYER"
      ? isPlayer
      : require === "ADMIN"
      ? isAdmin
      : isSuperAdmin;

  if (!allowed) return <Navigate to="/" replace />;

  return <Outlet />;
}