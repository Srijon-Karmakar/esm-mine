// import React, { useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { useAuth } from "../../auth/AuthContext";

// export default function Signup() {
//   const nav = useNavigate();
//   const { signup } = useAuth();

//   const [role] = useState("Player"); // Option-1: fixed, UI-only
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState(""); // UI only (not sent to backend yet)
//   const [password, setPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const passwordError = useMemo(() => {
//     if (!password && !confirmPassword) return "";
//     if (password.length > 0 && password.length < 6) return "Password must be at least 6 characters.";
//     if (confirmPassword && password !== confirmPassword) return "Passwords do not match.";
//     return "";
//   }, [password, confirmPassword]);

//   const canSubmit = useMemo(() => {
//     return (
//       email.trim().length > 0 &&
//       password.length >= 6 &&
//       confirmPassword.length >= 6 &&
//       password === confirmPassword &&
//       !loading
//     );
//   }, [email, password, confirmPassword, loading]);

//   const onSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);

//     // client validation
//     if (password.length < 6) return setError("Password must be at least 6 characters.");
//     if (password !== confirmPassword) return setError("Passwords do not match.");

//     setLoading(true);
//     try {
//       // Backend: only accepts (email, password, fullName?)
//       // We keep role + phone for UI only, until you extend backend.
//       await signup(email.trim(), password, undefined);
//       nav("/", { replace: true });
//     } catch (err: any) {
//       setError(err?.response?.data?.message || "Signup failed");
//     } finally {
//       setLoading(false);
//     }
//   };

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
//             {/* home icon */}
//             <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
//               <path
//                 d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-7a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v7H4a1 1 0 0 1-1-1V10.5z"
//                 stroke="#111827"
//                 strokeWidth="1.6"
//                 strokeLinejoin="round"
//               />
//             </svg>
//           </Link>

//           {/* Role (UI-only, disabled) */}
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

//         {/* Main cards: mobile-first stack, desktop side-by-side */}
//         <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
//           {/* LEFT BRAND CARD */}
//           <div
//             className="relative overflow-hidden rounded-3xl p-8 min-h-[280px] lg:min-h-[520px]
//                        bg-gradient-to-b from-[#4F57A7] to-[#191C2F]
//                        shadow-[10px_10px_26px_rgba(120,120,180,0.28),-10px_-10px_26px_rgba(255,255,255,0.85)]"
//           >
//             {/* soft highlight */}
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
//             <h2 className="text-2xl font-semibold text-white">Signup</h2>

//             <form onSubmit={onSubmit} className="mt-6 space-y-5">
//               {error && (
//                 <div className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-100 border border-red-300/25">
//                   {error}
//                 </div>
//               )}

//               {/* Email */}
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
//                     placeholder=""
//                     required
//                     className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
//                     autoComplete="email"
//                   />
//                 </div>
//               </div>

//               {/* Password */}
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
//                     minLength={6}
//                     required
//                     className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
//                     autoComplete="new-password"
//                   />
//                 </div>
//               </div>

//               {/* Re-type Password */}
//               <div>
//                 <label className="text-sm font-medium text-white/90">Re-type Password</label>
//                 <div
//                   className="mt-2 rounded-2xl bg-[#E7E9FF]
//                              shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
//                 >
//                   <input
//                     type="password"
//                     value={confirmPassword}
//                     onChange={(e) => setConfirmPassword(e.target.value)}
//                     minLength={6}
//                     required
//                     className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
//                     autoComplete="new-password"
//                   />
//                 </div>
//                 {!!passwordError && (
//                   <p className="mt-2 text-xs text-yellow-100/90">{passwordError}</p>
//                 )}
//               </div>

//               {/* Phone */}
//               <div>
//                 <label className="text-sm font-medium text-white/90">Phone Number</label>
//                 <div
//                   className="mt-2 rounded-2xl bg-[#E7E9FF]
//                              shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]"
//                 >
//                   <input
//                     type="tel"
//                     value={phone}
//                     onChange={(e) => setPhone(e.target.value)}
//                     className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
//                     autoComplete="tel"
//                     placeholder=""
//                   />
//                 </div>
//                 <p className="mt-2 text-[11px] text-white/70">
//                   Phone is UI-only for now (backend doesn’t store it yet).
//                 </p>
//               </div>

//               {/* Button */}
//               <div className="pt-2">
//                 <button
//                   disabled={!canSubmit}
//                   className="mx-auto block rounded-full px-10 py-2.5 text-sm font-semibold
//                              bg-[#E9E86A] text-slate-900
//                              shadow-[6px_6px_14px_rgba(0,0,0,0.22),-6px_-6px_14px_rgba(255,255,255,0.35)]
//                              active:shadow-[inset_6px_6px_14px_rgba(0,0,0,0.18),inset_-6px_-6px_14px_rgba(255,255,255,0.35)]
//                              disabled:opacity-60 disabled:cursor-not-allowed transition"
//                 >
//                   {loading ? "Creating..." : "Signup"}
//                 </button>

//                 <div className="mt-5 text-center text-sm text-white/85">
//                   Already have an account?{" "}
//                   <Link to="/login" className="font-semibold text-white underline underline-offset-4">
//                     Login
//                   </Link>
//                 </div>
//               </div>
//             </form>
//           </div>
//         </div>

//         {/* small footer note */}
//         <p className="mt-8 text-center text-xs text-slate-500">
//           Secure signup — role stays default (Player). Admin can upgrade roles later.
//         </p>
//       </div>
//     </div>
//   );
// }


















import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function Signup() {
  const nav = useNavigate();
  const { signup, refreshMe } = useAuth();

  const [role] = useState("Player"); // UI-only (disabled)
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); // UI-only
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordError = useMemo(() => {
    if (!password && !confirmPassword) return "";
    if (password.length > 0 && password.length < 6)
      return "Password must be at least 6 characters.";
    if (confirmPassword && password !== confirmPassword)
      return "Passwords do not match.";
    return "";
  }, [password, confirmPassword]);

  const canSubmit = useMemo(() => {
    return (
      email.trim().length > 0 &&
      password.length >= 6 &&
      confirmPassword.length >= 6 &&
      password === confirmPassword &&
      !loading
    );
  }, [email, password, confirmPassword, loading]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await signup(email.trim(), password, undefined);
      await refreshMe();

      // new users default -> player dashboard
      nav("/player/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E7E9FF] text-slate-800">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Top row */}
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

          <div className="relative">
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
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          {/* Brand */}
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

          {/* Form */}
          <div
            className="rounded-3xl p-6 sm:p-8 bg-[#5B5FA8]
                       shadow-[10px_10px_26px_rgba(120,120,180,0.28),-10px_-10px_26px_rgba(255,255,255,0.85)]"
          >
            <h2 className="text-2xl font-semibold text-white">Signup</h2>

            <form onSubmit={onSubmit} className="mt-6 space-y-5">
              {error && (
                <div className="rounded-2xl bg-red-500/15 px-4 py-3 text-sm text-red-100 border border-red-300/25">
                  {error}
                </div>
              )}

              <div>
                <label className="text-lg font-medium text-white/90">Email</label>
                <div className="mt-2 rounded-xl bg-[#E7E9FF] shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label className="text-lg font-medium text-white/90">Password</label>
                <div className="mt-2 rounded-xl bg-[#E7E9FF] shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div>
                <label className="text-lg font-medium text-white/90">
                  Re-type Password
                </label>
                <div className="mt-2 rounded-xl bg-[#E7E9FF] shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={6}
                    required
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                    autoComplete="new-password"
                  />
                </div>
                {!!passwordError && (
                  <p className="mt-2 text-xs text-yellow-100/90">{passwordError}</p>
                )}
              </div>

              <div>
                <label className="text-lg font-medium text-white/90">
                  Phone Number
                </label>
                <div className="mt-2 rounded-xl bg-[#E7E9FF] shadow-[inset_6px_6px_12px_rgba(120,120,180,0.24),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-transparent px-4 py-3 text-sm text-slate-800 outline-none"
                    autoComplete="tel"
                  />
                </div>
                <p className="mt-2 text-[11px] text-white/70">
                  Phone is UI-only for now (backend doesn’t store it yet).
                </p>
              </div>

              <div className="pt-4">
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
                  {loading ? "Creating..." : "Signup"}
                </button>

                <div className="mt-6 text-center text-sm text-white/85">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-white underline underline-offset-4"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-500">
          Secure signup — role stays default (Player). Admin can upgrade roles later.
        </p>
      </div>
    </div>
  );
}