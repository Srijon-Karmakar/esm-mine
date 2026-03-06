import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";

// Guards
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";

// Public pages
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Register";

// Layouts
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import AdminLayout from "./layouts/AdminLayout";

// Super Admin pages
import SuperAdminDashboard from "./pages/superAdmin/SuperAdminDashboard";
import Clubs from "./pages/superAdmin/Clubs";
import Users from "./pages/superAdmin/Users";
import Access from "./pages/superAdmin/Access";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

// Player pages (we just made)
import PlayerDashboard from "./pages/player/PlayerDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ----------------------------- */}
          {/* Public Routes */}
          {/* ----------------------------- */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ----------------------------- */}
          {/* Player Routes */}
          {/* ----------------------------- */}
          <Route element={<RoleRoute require="PLAYER" />}>
            {/* redirect /player -> /player/dashboard */}
            <Route path="/player" element={<Navigate to="/player/dashboard" replace />} />

            <Route path="/player/dashboard" element={<PlayerDashboard />} />
            <Route path="/player/profile" element={<PlayerDashboard />} />
            <Route path="/player/performance" element={<PlayerDashboard />} />
            <Route path="/player/statistics" element={<PlayerDashboard />} />
            <Route path="/player/transfers" element={<PlayerDashboard />} />
            <Route path="/player/social" element={<PlayerDashboard />} />
            <Route path="/player/health" element={<PlayerDashboard />} />

            {/* unknown player routes */}
            <Route path="/player/*" element={<Navigate to="/player/dashboard" replace />} />
          </Route>

          {/* ----------------------------- */}
          {/* Super Admin Routes */}
          {/* ----------------------------- */}
          <Route
            element={<RoleRoute require="SUPERADMIN" systemSlug="esportm-system" />}
          >
            <Route path="/superadmin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="clubs" element={<Clubs />} />
              <Route path="users" element={<Users />} />
              <Route path="access" element={<Access />} />
              <Route path="*" element={<Navigate to="/superadmin" replace />} />
            </Route>
          </Route>

          {/* ----------------------------- */}
          {/* Admin Routes */}
          {/* ----------------------------- */}
          <Route element={<RoleRoute require="ADMIN" />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>
          </Route>

          {/* ----------------------------- */}
          {/* Generic Protected Group (optional) */}
          {/* ----------------------------- */}
          <Route element={<ProtectedRoute />}>
            {/* Add other protected routes here */}
          </Route>

          {/* ----------------------------- */}
          {/* Not Found */}
          {/* ----------------------------- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}