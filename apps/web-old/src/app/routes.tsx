import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

import DashboardHome from "../pages/dashboard/Home";
import ClubList from "../pages/clubs/ClubList";
import ClubDetails from "../pages/clubs/ClubDetails";

import { isAuthed } from "../lib/auth";

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to="/auth/login" replace />;
  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },

  {
    path: "/auth",
    element: <AuthLayout />,
    children: [
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
    ],
  },

  {
    path: "/",
    element: (
      <Protected>
        <DashboardLayout />
      </Protected>
    ),
    children: [
      { path: "dashboard", element: <DashboardHome /> },
      { path: "clubs", element: <ClubList /> },
      { path: "clubs/:clubId", element: <ClubDetails /> },
    ],
  },
]);
