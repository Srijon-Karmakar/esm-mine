import { Outlet, Link } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">EsportM</h1>
          <p className="text-sm text-white/60">Login / Register to continue</p>
        </div>

        <Outlet />

        <div className="mt-6 text-xs text-white/50">
          <Link className="hover:text-white" to="/dashboard">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
