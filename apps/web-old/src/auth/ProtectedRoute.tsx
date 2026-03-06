import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
          Loading...
        </div>
      </div>
    );
  }

  const location = useLocation();

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}