import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PlayerRoute({
  allowNoMembership = true,
}: {
  allowNoMembership?: boolean;
}) {
  const { token, user, isLoading } = useAuth() as any;

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#E7E9FF] text-slate-700">
        Loading...
      </div>
    );
  }

  // must be logged in
  if (!token) return <Navigate to="/login" replace />;

  const memberships = user?.memberships || [];

  // ✅ simple policy:
  // - allow if PLAYER membership exists
  // - OR allow if memberships empty (new user) when allowNoMembership=true
  const isPlayer = memberships.some((m: any) => m.primary === "PLAYER");
  const hasNoMembership = memberships.length === 0;

  if (!isPlayer && !(allowNoMembership && hasNoMembership)) {
    // if user is ADMIN/MANAGER etc, send them away
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}