// import React, { useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../auth/AuthContext";

// export default function Login() {
//   const nav = useNavigate();
//   // const { login } = useAuth();
//   // const { login, refreshMe } = useAuth();

//   const [role] = useState("Player"); // UI-only, disabled
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const canSubmit = useMemo(() => {
//     return email.trim().length > 0 && password.length > 0 && !loading;
//   }, [email, password, loading]);

//   const { login, refreshMe } = useAuth();

// const onSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
//   setError(null);
//   setLoading(true);

//   try {
//     await login(email.trim(), password);
//     await refreshMe(); // ✅ now works

//     const raw = localStorage.getItem("user");
// console.log("LOCAL user:", raw);

//     const u = JSON.parse(localStorage.getItem("user") || "{}");
//     const memberships = u?.memberships || [];

//     const isSuperAdmin = memberships.some(
//       (m: any) => m.primary === "ADMIN" && m.club?.slug === "esportm-system"
//     );

//     const isAdmin = memberships.some((m: any) => m.primary === "ADMIN");

//     if (isSuperAdmin) return nav("/superadmin", { replace: true });
//     if (isAdmin) return nav("/admin", { replace: true });

//     return nav("/player", { replace: true });
//   } catch (err: any) {
//     setError(err?.response?.data?.message || "Login failed");
//   } finally {
//     setLoading(false);
//   }
// };

//   return (
//     <div className="min-h-screen w-full bg-[#E7E9FF] text-slate-800">
//       <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
//         {/* Top row: Home button + role dropdown */}
//         <div className="mb-6 flex items-center justify-between">
//           <Link
//             to="/"
//             className="grid h-12 w-12 place-items-center rounded-2xl bg-[#E7E9FF]
//                        shadow-[8px_8px_18px_rgba(120,120,180,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]
//                        active:shadow-[inset_6px_6px_14px_rgba(120,120,180,0.22),inset_-6px_-6px_14px_rgba(255,255,255,0.9)]
//                        transition"
//             aria-label="Go Home"
//             title="Home"
//           >
//             <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//               <path
//                 d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v7H4a1 1 0 0 1-1-1V10.5z"
//                 stroke="#111827"
//                 strokeWidth="1.6"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </Link>

//           <div className="relative">
//             <select
//               value={role}
//               disabled
//               className="h-12 w-56 appearance-none rounded-2xl px-4 pr-12 text-sm font-medium text-slate-700
//                          bg-[#E7E9FF]
//                          shadow-[8px_8px_18px_rgba(120,120,180,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]
//                          opacity-90 cursor-not-allowed"
//               aria-label="Role"
//             >
//               <option></option>
//             </select>
//             <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
//               {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//                 <path d="M6 9l6 6 6-6" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
//               </svg> */}
//             </div>

//           </div>
//         </div>

//         <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
//           {/* LEFT BRAND CARD */}
//           <div
//             className="relative overflow-hidden rounded-3xl p-8 min-h-[280px] lg:min-h-[520px]
//                        bg-gradient-to-b from-[#4F57A7] to-[#191C2F]
//                        shadow-[10px_10px_26px_rgba(120,120,180,0.28),-10px_-10px_26px_rgba(255,255,255,0.85)]"
//           >
//             <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
//             <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-indigo-300/20 blur-2xl" />

//             <div className="absolute bottom-7 left-7 right-7">
//               <h1 className="text-4xl font-semibold tracking-tight text-white/90">EsportM</h1>
//               <p className="mt-3 max-w-xs text-base leading-snug text-white/70">
//                 Ai Powered sports <br /> management system
//               </p>
//             </div>
//           </div>

//           {/* RIGHT FORM CARD */}
//           <div
//             className="rounded-3xl p-6 sm:p-8 bg-[#5B5FA8]
//                        shadow-[10px_10px_26px_rgba(120,120,180,0.28),-10px_-10px_26px_rgba(255,255,255,0.85)]"
//           >
//             <h2 className="text-2xl font-semibold text-white">Login</h2>

//             <form onSubmit={onSubmit} className="mt-6 space-y-5">
//               {error && (
//                 <div className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-100 border border-red-300/25">
//                   {error}
//                 </div>
//               )}

//               <div>
//                 <label className="text-sm font-medium text-white/90">Email</label>
//                 <div
//                   className="mt-2 rounded-2xl bg-[#E7E9FF]
//                              shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
//                 >
//                   <input
//                     type="email"
//                     value={email}
//                     onChange={(e) => setEmail(e.target.value)}
//                     required
//                     className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
//                     autoComplete="email"
//                   />
//                 </div>
//               </div>

//               <div>
//                 <label className="text-sm font-medium text-white/90">Password</label>
//                 <div
//                   className="mt-2 rounded-2xl bg-[#E7E9FF]
//                              shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
//                 >
//                   <input
//                     type="password"
//                     value={password}
//                     onChange={(e) => setPassword(e.target.value)}
//                     required
//                     className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
//                     autoComplete="current-password"
//                   />
//                 </div>
//               </div>

//               <div className="pt-2">
//                 <button
//                   disabled={!canSubmit}
//                   className="mx-auto block rounded-full px-10 py-2.5 text-sm font-semibold
//                              bg-[#E9E86A] text-slate-900
//                              shadow-[6px_6px_14px_rgba(0,0,0,0.22),-6px_-6px_14px_rgba(255,255,255,0.35)]
//                              active:shadow-[inset_6px_6px_14px_rgba(0,0,0,0.18),inset_-6px_-6px_14px_rgba(255,255,255,0.35)]
//                              disabled:opacity-60 disabled:cursor-not-allowed transition"
//                 >
//                   {loading ? "Logging in..." : "Login"}
//                 </button>

//                 <div className="mt-5 text-center text-sm text-white/85">
//                   Don’t have an account?{" "}
//                   <Link to="/signup" className="font-semibold text-white underline underline-offset-4">
//                     Signup
//                   </Link>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>

//         <p className="mt-8 text-center text-xs text-slate-500">
//           Secure login — token is stored and used for protected APIs.
//         </p>
//       </div>
//     </div>
//   );
// }





































import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const SYSTEM_SLUG = "esportm-system";

function resolveRedirect(user: any) {
  const memberships = user?.memberships ?? [];

  // SUPERADMIN = Admin of system club (your current backend logic)
  const isSuperAdmin = memberships.some(
    (m: any) => m?.primary === "ADMIN" && m?.club?.slug === SYSTEM_SLUG
  );

  const isAdmin = memberships.some((m: any) => m?.primary === "ADMIN");
  const isPlayer = memberships.some((m: any) => m?.primary === "PLAYER");

  if (isSuperAdmin) return "/superadmin";
  if (isAdmin) return "/admin";
  if (isPlayer) return "/player/dashboard";
  return "/";
}

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { login, refreshMe } = useAuth();

  const [role] = useState("Player"); // UI-only (disabled) as per design
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 0 && password.length > 0 && !loading;
  }, [email, password, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      // await refreshMe();
      const me = await refreshMe();
      console.log("AFTER REFRESH ME:", me);
      console.log("MEMBERSHIPS:", me?.memberships);


      // Support either a string `from` or a location object set by route guards.
      const rawFrom = (location.state as any)?.from;
      let fromPath: string | undefined;
      if (typeof rawFrom === "string") fromPath = rawFrom;
      else if (rawFrom && typeof rawFrom === "object") fromPath = rawFrom.pathname;

      // Avoid redirecting back to auth pages
      if (fromPath === "/login" || fromPath === "/signup") fromPath = undefined;

      nav(fromPath || resolveRedirect(me), { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E7E9FF] text-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Top row: Home button + role dropdown */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="grid h-14 w-14 place-items-center rounded-2xl bg-[#E7E9FF]
                       shadow-[8px_8px_18px_rgba(120,120,180,0.25),-8px_-8px_18px_rgba(255,255,255,0.9)]
                       hover:brightness-[1.02]
                       active:shadow-[inset_6px_6px_14px_rgba(120,120,180,0.22),inset_-6px_-6px_14px_rgba(255,255,255,0.9)]
                       active:scale-[0.99]
                       transition"
            aria-label="Go Home"
            title="Home"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v7H4a1 1 0 0 1-1-1V10.5z"
                stroke="#111827"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </Link>

          {/* <div className="relative">
            <select
              value={role}
              disabled
              className="h-14 w-64 appearance-none rounded-2xl px-5 pr-14 text-base font-medium text-slate-100
                         bg-[#6C6F7E]
                         shadow-[10px_10px_22px_rgba(120,120,180,0.22),-10px_-10px_22px_rgba(255,255,255,0.75)]
                         opacity-95 cursor-not-allowed"
              aria-label="Role"
            >
              <option>Player</option>
            </select>

            <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="#E5E7EB"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div> */}

        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* LEFT BRAND CARD */}
          <div
            className="relative overflow-hidden rounded-3xl p-8 min-h-[280px] lg:min-h-[520px]
                       bg-gradient-to-b from-[#5B62B3] to-[#1B1F36]
                       shadow-[10px_10px_26px_rgba(120,120,180,0.28),-10px_-10px_26px_rgba(255,255,255,0.85)]"
          >
            <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
            <div className="pointer-events-none absolute -right-24 top-10 h-64 w-64 rounded-full bg-indigo-300/15 blur-2xl" />

            <div className="absolute bottom-7 left-7 right-7">
              <h1 className="text-4xl font-semibold tracking-tight text-white/90">
                EsportM
              </h1>
              <p className="mt-3 max-w-xs text-base leading-snug text-white/70">
                Ai Powered sports <br /> management system
              </p>
            </div>
          </div>

          {/* RIGHT FORM CARD */}
          <div
            className="rounded-3xl p-6 sm:p-8 bg-[#5B5FA8]
                       shadow-[10px_10px_26px_rgba(120,120,180,0.28),-10px_-10px_26px_rgba(255,255,255,0.85)]"
          >
            <h2 className="text-2xl font-semibold text-white">Login</h2>

            <form onSubmit={onSubmit} className="mt-6 space-y-6">
              {error && (
                <div className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-100 border border-red-300/25">
                  {error}
                </div>
              )}

              <div>
                <label className="text-lg font-medium text-white/90">Email</label>
                <div
                  className="mt-2 rounded-xl bg-[#E7E9FF]
                             shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                    autoComplete="email"
                    placeholder=""
                  />
                </div>
              </div>

              <div>
                <label className="text-lg font-medium text-white/90">
                  Password
                </label>
                <div
                  className="mt-2 rounded-xl bg-[#E7E9FF]
                             shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
                >
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                    autoComplete="current-password"
                    placeholder=""
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  disabled={!canSubmit}
                  className="mx-auto block rounded-full px-12 py-3 text-base font-semibold
                             bg-[#E9E86A] text-slate-900
                             shadow-[8px_8px_18px_rgba(0,0,0,0.18),-8px_-8px_18px_rgba(255,255,255,0.35)]
                             hover:brightness-[1.02]
                             active:shadow-[inset_8px_8px_18px_rgba(0,0,0,0.14),inset_-8px_-8px_18px_rgba(255,255,255,0.35)]
                             active:scale-[0.99]
                             disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <div className="mt-6 text-center text-sm text-white/85">
                  Don’t have an account?{" "}
                  <Link
                    to="/signup"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    Signup
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Secure login — token is stored and used for protected APIs.
        </p>
      </div>
    </div>
  );
}