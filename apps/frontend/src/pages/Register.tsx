// import { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import NeuCard from "../components/NeuCard";
// import NeuInput from "../components/NeuInput";
// import NeuButton from "../components/NeuButton";
// import RoleSelect from "../components/RoleSelect";
// import { registerUser } from "../api/auth";

// export default function Register() {
//   const navigate = useNavigate();

//   // UI only
//   const [role, setRole] = useState("Player");

//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");

//   const [loading, setLoading] = useState(false);
//   const [err, setErr] = useState<string | null>(null);

//   // if already logged in, go dashboard
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     if (token) navigate("/dashboard", { replace: true });
//   }, [navigate]);

//   const canSubmit = useMemo(() => {
//     return (
//       email.trim().length > 3 &&
//       password.trim().length >= 6 &&
//       // backend fullName optional, but for UI we want it
//       fullName.trim().length >= 2
//     );
//   }, [fullName, email, password]);

//   const onSubmit = async () => {
//     setErr(null);
//     if (!canSubmit || loading) return;

//     try {
//       setLoading(true);

//       const data = await registerUser({
//         email: email.trim(),
//         password: password.trim(),
//         fullName: fullName.trim(),
//       });

//       // you can auto-login after signup
//       localStorage.setItem("token", data.accessToken);
//       localStorage.setItem("user", JSON.stringify(data.user));

//       navigate("/dashboard", { replace: true });
//     } catch (e: any) {
//       setErr(e?.response?.data?.message || e?.message || "Signup failed");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-bg flex items-center justify-center p-4">
//       <div className="w-full max-w-5xl grid md:grid-cols-2 gap-5 items-stretch">
//         {/* Brand panel */}
//         <NeuCard className="relative overflow-hidden p-0">
//           <div className="h-full rounded-3xl bg-gradient-to-b from-[#5b5ea9] to-[#1c1f45] p-8 md:p-10 text-white flex flex-col justify-end">
//             <h1 className="text-4xl md:text-5xl font-bold">EsportM</h1>
//             <p className="mt-3 text-white/80 text-base md:text-lg max-w-sm">
//               Create your account to manage clubs, matches, stats and AI insights.
//             </p>
//           </div>
//         </NeuCard>

//         {/* Form panel */}
//         <NeuCard className="relative overflow-hidden p-0">
//           <div className="h-full rounded-3xl bg-[#5b5ea9] p-6 md:p-10">
//             <RoleSelect role={role} setRole={setRole} />

//             <h2 className="text-2xl font-bold text-white mt-6 mb-6">Signup</h2>

//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-semibold text-white/90 block mb-2">
//                   Full Name
//                 </label>
//                 <NeuInput
//                   className="bg-white/90"
//                   placeholder="Your name"
//                   value={fullName}
//                   onChange={(e) => setFullName(e.target.value)}
//                   autoComplete="name"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-white/90 block mb-2">
//                   Email
//                 </label>
//                 <NeuInput
//                   className="bg-white/90"
//                   placeholder="Email address"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   autoComplete="email"
//                 />
//               </div>

//               <div>
//                 <label className="text-sm font-semibold text-white/90 block mb-2">
//                   Password
//                 </label>
//                 <NeuInput
//                   className="bg-white/90"
//                   type="password"
//                   placeholder="Minimum 6 characters"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   onKeyDown={(e) => e.key === "Enter" && onSubmit()}
//                   autoComplete="new-password"
//                 />
//               </div>

//               {err && (
//                 <div className="rounded-2xl bg-white/15 text-white px-4 py-3 text-sm">
//                   {err}
//                 </div>
//               )}

//               <div className="pt-5 flex items-center justify-between gap-3">
//                 <Link to="/login" className="text-white/90 text-sm underline">
//                   Already have an account?
//                 </Link>

//                 <NeuButton
//                   onClick={onSubmit}
//                   disabled={!canSubmit || loading}
//                   className="bg-[#d6d85a] text-black shadow-none hover:opacity-95 active:scale-[0.98] px-10"
//                 >
//                   {loading ? "Creating..." : "Signup"}
//                 </NeuButton>
//               </div>
//             </div>
//           </div>
//         </NeuCard>
//       </div>
//     </div>
//   );
// }






































import { useEffect, useMemo, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { registerUser } from "../api/auth";
import { getAccessToken, setAccessToken } from "../utils/authStorage";

export default function Register() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  // --- State Management ---
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [retypePassword, setRetypePassword] = useState("");

  // UX States
  const [showPassword, setShowPassword] = useState(false);
  const [showRetypePassword, setShowRetypePassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // --- Redirect if already logged in ---
  useEffect(() => {
    const token = getAccessToken() || localStorage.getItem("token");
    if (token) navigate("/dashboard", { replace: true });
  }, [navigate]);

  // --- Form Validation ---
  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 3 &&
      password.trim().length >= 6 &&
      password === retypePassword &&
      agreeTerms
    );
  }, [fullName, email, password, retypePassword, agreeTerms]);

  // --- Backend Integration ---
  const onSubmit = async () => {
    setErr(null);
    if (!canSubmit || loading) return;

    if (password !== retypePassword) {
      setErr("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const data = await registerUser({
        email: email.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
      });

      setAccessToken(data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      navigate("/dashboard", { replace: true });
    } catch (e: any) {
      setErr(e?.response?.data?.message || e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // --- GSAP Animations ---
  useGSAP(() => {
    // Animate the main container
    gsap.from(".glass-card", {
      y: 50,
      opacity: 0,
      duration: 1,
      ease: "power3.out",
    });

    // Stagger animate the form elements
    gsap.from(".anim-item", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      stagger: 0.08,
      ease: "power2.out",
      delay: 0.3,
    });
  }, { scope: containerRef });

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-[#5a5ba6] via-[#5a5ba6] to-[#5a5ba6] flex items-center justify-center p-4 sm:p-6 lg:p-10 font-sans"
    >
      {/* Main Glass Container */}
      <div className="glass-card w-full max-w-[1100px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] flex flex-col lg:flex-row overflow-hidden">

        
        {/* --- Left Column: Image Area --- */}
        <div className="relative w-full lg:w-1/2 min-h-[200px] sm:min-h-[300px] lg:min-h-full p-4 lg:p-6 hidden sm:flex items-center justify-center">
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden shadow-2xl bg-white/5 flex items-center justify-center">
            <img
              src="/images/signup-image.jpg"
              alt="VR Esport Setup"
              className="max-w-full max-h-full object-contain"
            />

            {/* Logo Overlay */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
              <svg
                className="w-10 h-10 text-white drop-shadow-lg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- Right Column: Form Area --- */}
        <div className="w-full lg:w-1/2 p-6 sm:p-10 lg:p-12 flex flex-col justify-center relative">

          {/* Back Button */}
          <Link to="/" className="anim-item absolute top-6 left-6 lg:top-10 lg:left-10 text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="max-w-md mx-auto w-full mt-8 lg:mt-0">
            {/* Headings */}
            <div className="anim-item mb-6">
              <h1 className="text-3xl lg:text-4xl font-semibold text-white mb-2">Create Account</h1>
              <p className="text-white/70 text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-white font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4">
              {/* Full Name Input */}
              <div className="anim-item">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 text-white placeholder-white/40 rounded-full px-5 py-3 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>

              {/* Email Input */}
              <div className="anim-item">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 text-white placeholder-white/40 rounded-full px-5 py-3 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>

              {/* Phone Number Input */}
              <div className="anim-item">
                <input
                  type="tel"
                  placeholder="Phone Number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 text-white placeholder-white/40 rounded-full px-5 py-3 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all text-sm"
                />
              </div>

              {/* Password Input */}
              <div className="anim-item relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 text-white placeholder-white/40 rounded-full px-5 py-3 pr-12 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>

              {/* Retype Password Input */}
              <div className="anim-item relative">
                <input
                  type={showRetypePassword ? "text" : "password"}
                  placeholder="Re-type Password"
                  value={retypePassword}
                  onChange={(e) => setRetypePassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                  className="w-full bg-white/5 border border-white/20 text-white placeholder-white/40 rounded-full px-5 py-3 pr-12 focus:outline-none focus:border-white/50 focus:bg-white/10 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowRetypePassword(!showRetypePassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showRetypePassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  )}
                </button>
              </div>

              {/* Error Message */}
              {err && (
                <div className="anim-item text-[#ffb3b3] bg-red-500/10 p-3 rounded-lg text-sm text-center border border-red-500/20 backdrop-blur-sm">
                  {err}
                </div>
              )}

              {/* Terms & Conditions */}
              <div className="anim-item flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-black focus:ring-black bg-white/20 cursor-pointer"
                />
                <label htmlFor="terms" className="text-sm text-white/70 cursor-pointer">
                  I agree to the <Link to="/terms" className="text-white font-medium hover:underline">Terms & Condition</Link>
                </label>
              </div>

              {/* Signup Button */}
              <div className="anim-item pt-4">
                <button
                  onClick={onSubmit}
                  disabled={!canSubmit || loading}
                  className="w-full bg-white text-black font-semibold rounded-full py-3.5 hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating Account..." : "Sign Up"}
                </button>
              </div>

              {/* Divider */}
              <div className="anim-item flex items-center gap-4 my-6 opacity-60">
                <div className="flex-1 h-px bg-white/20"></div>
                <span className="text-sm text-white/80"></span>
                <div className="flex-1 h-px bg-white/20"></div>
              </div>

              {/* Social Logins */}
              <div className="anim-item grid grid-cols-1 sm:grid-cols-2 gap-4">

              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
