// // src/layouts/AppShell.tsx
// import { useEffect, useMemo, useState } from "react";
// import { Outlet, useNavigate } from "react-router-dom";

// import Sidebar from "../components/ui/Sidebar";
// import type { SidebarItem, SidebarUser } from "../components/ui/Sidebar";

// import { ThemePanel } from "../theme/ThemePanel";
// import { me } from "../api/auth.api";
// import { mapToSidebarUser } from "../utils/mapSidebarUser";

// type NavKey =
//   | "dashboard"
//   | "squad"
//   | "training"
//   | "wearables"
//   | "contracts"
//   | "calendar"
//   | "reviews"
//   | "settings";

// const topNav: { key: NavKey; label: string }[] = [
//   { key: "dashboard", label: "Dashboard" },
//   { key: "squad", label: "Squad" },
//   { key: "training", label: "Training" },
//   { key: "wearables", label: "Wearables" },
//   { key: "contracts", label: "Contracts" },
//   { key: "calendar", label: "Calendar" },
//   { key: "reviews", label: "Reviews" },
// ];

// const sectionItems: SidebarItem[] = [
//   { label: "Training", to: "/dashboard/training" },
//   { label: "Matches", to: "/dashboard/matches" },
//   { label: "Stats", to: "/dashboard/stats" },
//   { label: "Medical", to: "/dashboard/medical" },
//   { label: "Messages", to: "/dashboard/messages" },
//   { label: "Settings", to: "/dashboard/settings" },
// ];

// function cx(...s: Array<string | false | undefined>) {
//   return s.filter(Boolean).join(" ");
// }

// /**
//  * OK Glass tokens
//  * Use these instead of dark borders.
//  */
// const GLASS_BORDER = "rgba(255,255,255,0.38)";
// const GLASS_BORDER_STRONG = "rgba(255,255,255,0.52)";
// const GLASS_SHADOW = "0 28px 80px rgba(20,24,32,0.10)";
// const GLASS_BG = "rgba(255,255,255,0.52)";

// function GlassBackdrop() {
//   return (
//     <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
//       {/* Base gradient wash */}
//       <div
//         className="absolute inset-0"
//         style={{
//           background:
//             "radial-gradient(900px 520px at 15% 15%, rgba(255,255,255,.70), transparent 55%), radial-gradient(900px 520px at 85% 20%, rgba(var(--primary),.22), transparent 60%), radial-gradient(900px 520px at 92% 85%, rgba(var(--primary),.14), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,0))",
//         }}
//       />

//       {/* soft blobs */}
//       <svg
//         className="absolute -left-44 -top-48 h-[640px] w-[640px] opacity-60 blur-[2px]"
//         viewBox="0 0 600 600"
//         aria-hidden="true"
//       >
//         <defs>
//           <radialGradient id="g1" cx="30%" cy="30%" r="70%">
//             <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
//             <stop offset="45%" stopColor="rgba(255,255,255,0.25)" />
//             <stop offset="100%" stopColor="rgba(255,255,255,0)" />
//           </radialGradient>
//         </defs>
//         <circle cx="300" cy="300" r="260" fill="url(#g1)" />
//       </svg>

//       <svg
//         className="absolute -right-52 top-10 h-[760px] w-[760px] opacity-70 blur-[3px]"
//         viewBox="0 0 700 700"
//         aria-hidden="true"
//       >
//         <defs>
//           <radialGradient id="g2" cx="55%" cy="45%" r="70%">
//             <stop offset="0%" stopColor="rgba(var(--primary),0.82)" />
//             <stop offset="55%" stopColor="rgba(var(--primary),0.24)" />
//             <stop offset="100%" stopColor="rgba(var(--primary),0)" />
//           </radialGradient>
//         </defs>
//         <circle cx="350" cy="350" r="320" fill="url(#g2)" />
//       </svg>

//       <svg
//         className="absolute left-[8%] bottom-[-320px] h-[820px] w-[820px] opacity-60 blur-[3px]"
//         viewBox="0 0 760 760"
//         aria-hidden="true"
//       >
//         <defs>
//           <radialGradient id="g3" cx="45%" cy="55%" r="70%">
//             <stop offset="0%" stopColor="rgba(var(--primary-2),0.44)" />
//             <stop offset="55%" stopColor="rgba(var(--primary-2),0.14)" />
//             <stop offset="100%" stopColor="rgba(var(--primary-2),0)" />
//           </radialGradient>
//         </defs>
//         <circle cx="380" cy="380" r="340" fill="url(#g3)" />
//       </svg>

//       {/* subtle lines */}
//       <svg
//         className="absolute left-0 top-0 h-full w-full opacity-[0.18]"
//         viewBox="0 0 1200 800"
//         preserveAspectRatio="none"
//         aria-hidden="true"
//       >
//         <defs>
//           <linearGradient id="ln" x1="0" y1="0" x2="1" y2="1">
//             <stop offset="0%" stopColor="rgba(0,0,0,0)" />
//             <stop offset="50%" stopColor="rgba(0,0,0,0.10)" />
//             <stop offset="100%" stopColor="rgba(0,0,0,0)" />
//           </linearGradient>
//         </defs>
//         <path
//           d="M-50 170 C 240 40, 420 480, 760 260 S 1150 210, 1300 420"
//           fill="none"
//           stroke="url(#ln)"
//           strokeWidth="2"
//         />
//         <path
//           d="M-60 520 C 240 320, 520 820, 820 520 S 1180 470, 1300 650"
//           fill="none"
//           stroke="url(#ln)"
//           strokeWidth="2"
//         />
//       </svg>

//       {/* grain */}
//       <svg
//         className="absolute inset-0 h-full w-full opacity-[0.075]"
//         aria-hidden="true"
//       >
//         <filter id="noise">
//           <feTurbulence
//             type="fractalNoise"
//             baseFrequency="0.9"
//             numOctaves="3"
//             stitchTiles="stitch"
//           />
//           <feColorMatrix
//             type="matrix"
//             values="
//               1 0 0 0 0
//               0 1 0 0 0
//               0 0 1 0 0
//               0 0 0 0.55 0"
//           />
//         </filter>
//         <rect width="100%" height="100%" filter="url(#noise)" />
//       </svg>
//     </div>
//   );
// }

// const FALLBACK_USER: SidebarUser = {
//   fullName: "Player",
//   userId: "-",
//   clubName: "-",
//   role: "Player",
//   position: "",
// };

// export default function AppShell() {
//   const navigate = useNavigate();

//   const [themeOpen, setThemeOpen] = useState(false);
//   const [active, setActive] = useState<NavKey>("dashboard");
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   // OK dynamic user state
//   const [user, setUser] = useState<SidebarUser>(FALLBACK_USER);
//   const [userLoading, setUserLoading] = useState(true);

//   useEffect(() => {
//     let alive = true;

//     async function loadMe() {
//       try {
//         setUserLoading(true);

//        const token =
//   localStorage.getItem("accessToken") || localStorage.getItem("token");

// if (!token) {
//   navigate("/login", { replace: true });
//   return;
// }

//         const data = await me();
//         const mapped = mapToSidebarUser(data);

//         if (alive) setUser(mapped);
//       } catch (err) {
//         localStorage.removeItem("token");
//         if (alive) navigate("/login", { replace: true });
//       } finally {
//         if (alive) setUserLoading(false);
//       }
//     }

//     loadMe();

//     return () => {
//       alive = false;
//     };
//   }, [navigate]);

//   const subtitle = useMemo(() => {
//     const map: Record<NavKey, string> = {
//       dashboard: "Overview  -  readiness  -  schedule",
//       squad: "Team  -  roles  -  availability",
//       training: "Load  -  sessions  -  recovery",
//       wearables: "HRV  -  GPS  -  sleep",
//       contracts: "Contract  -  bonuses",
//       calendar: "Matches  -  sessions",
//       reviews: "Coach feedback",
//       settings: "Preferences",
//     };
//     return map[active];
//   }, [active]);

//   const HEADER_H = 84;

//   return (
//     <div className="min-h-screen w-full bg-[rgb(var(--bg))]">
//       <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

//       {/* backdrop under canvas */}
//       <div className="relative">
//         <GlassBackdrop />

//         <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8">
//           {/* CANVAS (no black border) */}
//           <div
//             className={cx(
//               "relative overflow-hidden rounded-[28px]",
//               "backdrop-blur-2xl",
//               "shadow-[0_28px_80px_rgba(20,24,32,0.10)]"
//             )}
//             style={{
//               background: GLASS_BG,
//               border: `1px solid ${GLASS_BORDER}`,
//               boxShadow: GLASS_SHADOW,
//             }}
//           >
//             {/* glass highlight + subtle stroke */}
//             <div
//               className="pointer-events-none absolute inset-0"
//               style={{
//                 background:
//                   "linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.30))",
//                 opacity: 0.55,
//               }}
//             />
//             <div
//               className="pointer-events-none absolute inset-0"
//               style={{
//                 boxShadow:
//                   "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.20)",
//               }}
//             />

//             {/* Layout */}
//             <div className="relative z-10 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
//               {/* HEADER (glass, no dark divider) */}
//               <header
//                 className="sticky top-0 z-20 backdrop-blur-2xl"
//                 style={{
//                   height: HEADER_H,
//                   background: "rgba(255,255,255,0.40)",
//                   borderBottom: `1px solid ${GLASS_BORDER}`,
//                 }}
//               >
//                 <div className="h-full px-4 sm:px-6">
//                   <div className="flex h-full items-center justify-between gap-3">
//                     <div className="flex items-center gap-3">
//                       {/* mobile menu */}
//                       <button
//                         onClick={() => setSidebarOpen(true)}
//                         className="md:hidden rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
//                         style={{
//                           background: "rgba(255,255,255,0.55)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         Menu
//                       </button>

//                       {/* brand pill */}
//                       <div
//                         className="rounded-full px-4 py-2 text-sm font-semibold"
//                         style={{
//                           background: "rgba(255,255,255,0.50)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         EsportM
//                       </div>

//                       {/* top pills */}
//                       <nav
//                         className="hidden items-center gap-1 rounded-full p-1 sm:flex"
//                         style={{
//                           background: "rgba(255,255,255,0.44)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         {topNav.map((item) => {
//                           const on = item.key === active;
//                           return (
//                             <button
//                               key={item.key}
//                               onClick={() => setActive(item.key)}
//                               className="rounded-full px-3 py-2 text-xs font-semibold transition"
//                               style={{
//                                 background: on
//                                   ? "rgba(var(--primary), .55)"
//                                   : "transparent",
//                                 color: on
//                                   ? "rgb(var(--primary-2))"
//                                   : "rgb(var(--text))",
//                                 border: on
//                                   ? `1px solid ${GLASS_BORDER_STRONG}`
//                                   : "1px solid transparent",
//                               }}
//                             >
//                               {item.label}
//                             </button>
//                           );
//                         })}
//                       </nav>
//                     </div>

//                     <div className="flex items-center gap-2">
//                       <div className="hidden sm:block text-right">
//                         <p className="text-sm font-semibold text-[rgb(var(--text))]">
//                           EsportM  - {" "}
//                           {userLoading ? "Loading..." : user.role ?? "Player"}
//                         </p>
//                         <p className="text-xs text-[rgb(var(--muted))]">
//                           {subtitle}
//                         </p>
//                       </div>

//                       <button
//                         onClick={() => setThemeOpen(true)}
//                         className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
//                         style={{
//                           background: "rgba(255,255,255,0.50)",
//                           color: "rgb(var(--text))",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                       >
//                         Theme
//                       </button>

//                       <div
//                         className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold"
//                         style={{
//                           background: "rgba(255,255,255,0.48)",
//                           border: `1px solid ${GLASS_BORDER}`,
//                         }}
//                         title={user.fullName}
//                       >
//                         {user.fullName?.trim()?.[0]?.toUpperCase() ?? "P"}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </header>

//               {/* BODY */}
//               <div className="flex h-[calc(100%-84px)] gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
//                 {/* Desktop sticky sidebar (glass) */}
//                 <div className="hidden md:block shrink-0" style={{ width: 220 }}>
//                   <div className="sticky top-[96px]">
//                     <Sidebar
//                       open={sidebarOpen}
//                       onClose={() => setSidebarOpen(false)}
//                       items={sidebarItems}
//                       user={user}
//                     />
//                   </div>
//                 </div>

//                 {/* Mobile drawer */}
//                 <div className="md:hidden">
//                   <Sidebar
//                     open={sidebarOpen}
//                     onClose={() => setSidebarOpen(false)}
//                     items={sidebarItems}
//                     user={user}
//                   />
//                 </div>

//                 {/* Scroll only main */}
//                 <main className="min-w-0 flex-1 overflow-y-auto pr-1">
//                   {/* quick actions (mobile) */}
//                   <div className="mb-4 flex justify-end gap-2 sm:hidden">
//                     <button
//                       onClick={() => navigate("/")}
//                       className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
//                       style={{
//                         background: "rgba(255,255,255,0.50)",
//                         border: `1px solid ${GLASS_BORDER}`,
//                       }}
//                     >
//                       Home
//                     </button>

//                     <button
//                       onClick={() => {
//                         localStorage.removeItem("token");
//                         navigate("/login", { replace: true });
//                       }}
//                       className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:opacity-95"
//                       style={{
//                         background: "rgba(var(--primary), .65)",
//                         color: "rgb(var(--primary-2))",
//                         border: `1px solid ${GLASS_BORDER_STRONG}`,
//                       }}
//                     >
//                       Logout
//                     </button>
//                   </div>

//                   {/* Optional: small loading ribbon */}
//                   {userLoading && (
//                     <div
//                       className="mb-3 rounded-2xl border bg-white/50 px-4 py-3 text-sm backdrop-blur-md"
//                       style={{ borderColor: "rgba(var(--primary-2), .10)" }}
//                     >
//                       Loading profile...
//                     </div>
//                   )}

//                   <Outlet />
//                 </main>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
















































// src/layouts/AppShell.tsx
import { useEffect, useMemo, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "../components/ui/Sidebar";
import type { SidebarItem, SidebarUser } from "../components/ui/Sidebar";
import ConfirmModal from "../components/ui/ConfirmModal";

import { ThemePanel } from "../theme/ThemePanel";
import { useMe } from "../hooks/useMe";
import { mapToSidebarUser } from "../utils/mapSidebarUser";
import { clearAuth, getAccessToken } from "../utils/authStorage";
import {
  formatDashboardRole,
  getDashboardRoleAccess,
  pathForDashboardRole,
  type DashboardRole,
} from "../utils/dashboardRouting";

type NavKey =
  | "dashboard"
  | "squad"
  | "training"
  | "wearables"
  | "contracts"
  | "calendar"
  | "reviews"
  | "settings";

type DashboardRoleKey =
  | "ADMIN"
  | "MANAGER"
  | "PLAYER"
  | "MEMBER"
  | "COACH"
  | "PHYSIO"
  | "AGENT"
  | "NUTRITIONIST"
  | "PITCH_MANAGER";

const defaultTopNav: { key: NavKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "squad", label: "Squad" },
  { key: "training", label: "Training" },
  { key: "wearables", label: "Wearables" },
  { key: "contracts", label: "Contracts" },
  { key: "calendar", label: "Calendar" },
  { key: "reviews", label: "Reviews" },
];

const topNavByRole: Partial<Record<DashboardRoleKey, Array<{ key: NavKey; label: string }>>> = {
  PLAYER: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Training" },
    { key: "calendar", label: "Calendar" },
    { key: "reviews", label: "Reviews" },
  ],
  COACH: [
    { key: "dashboard", label: "Dashboard" },
    { key: "squad", label: "Squad" },
    { key: "training", label: "Training" },
    { key: "calendar", label: "Calendar" },
    { key: "reviews", label: "Reviews" },
  ],
  PHYSIO: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Training" },
    { key: "wearables", label: "Wearables" },
    { key: "reviews", label: "Reviews" },
  ],
  AGENT: [
    { key: "dashboard", label: "Dashboard" },
    { key: "squad", label: "Talent" },
    { key: "contracts", label: "Contracts" },
    { key: "calendar", label: "Calendar" },
    { key: "reviews", label: "Reports" },
  ],
  NUTRITIONIST: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Training" },
    { key: "wearables", label: "Load" },
    { key: "reviews", label: "Reviews" },
  ],
  PITCH_MANAGER: [
    { key: "dashboard", label: "Dashboard" },
    { key: "training", label: "Prep" },
    { key: "calendar", label: "Fixtures" },
    { key: "settings", label: "Settings" },
  ],
  MEMBER: [
    { key: "dashboard", label: "Dashboard" },
    { key: "settings", label: "Settings" },
  ],
};

const defaultSectionItems: SidebarItem[] = [
  { label: "Training", to: "/dashboard/training" },
  { label: "Matches", to: "/dashboard/matches" },
  { label: "Stats", to: "/dashboard/stats" },
  { label: "Medical", to: "/dashboard/medical" },
  { label: "Messages", to: "/dashboard/messages" },
  { label: "Social", to: "/dashboard/social" },
  { label: "Settings", to: "/dashboard/settings" },
];

const MARKETPLACE_SIDEBAR_ITEM: SidebarItem = {
  label: "Marketplace",
  to: "/marketplace",
};

const sectionItemsByRole: Partial<Record<DashboardRoleKey, SidebarItem[]>> = {
  PLAYER: defaultSectionItems,
  MANAGER: defaultSectionItems,
  ADMIN: defaultSectionItems,
  COACH: [
    { label: "Training", to: "/dashboard/training" },
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Stats", to: "/dashboard/stats" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  PHYSIO: [
    { label: "Medical", to: "/dashboard/medical" },
    { label: "Training", to: "/dashboard/training" },
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  AGENT: [
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Stats", to: "/dashboard/stats" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  NUTRITIONIST: [
    { label: "Training", to: "/dashboard/training" },
    { label: "Medical", to: "/dashboard/medical" },
    { label: "Stats", to: "/dashboard/stats" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  PITCH_MANAGER: [
    { label: "Matches", to: "/dashboard/matches" },
    { label: "Training", to: "/dashboard/training" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
  MEMBER: [
    { label: "Onboarding", to: "/dashboard/onboarding" },
    { label: "Messages", to: "/dashboard/messages" },
    { label: "Social", to: "/dashboard/social" },
    { label: "Settings", to: "/dashboard/settings" },
  ],
};

function cx(...s: Array<string | false | undefined>) {
  return s.filter(Boolean).join(" ");
}

/**
 * OK Glass tokens
 * Use these instead of dark borders.
 */
const GLASS_BORDER = "rgba(255,255,255,0.38)";
const GLASS_BORDER_STRONG = "rgba(255,255,255,0.52)";
const GLASS_SHADOW = "0 28px 80px rgba(20,24,32,0.10)";
const GLASS_BG = "rgba(255,255,255,0.52)";

function GlassBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {/* Base gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 520px at 15% 15%, rgba(255,255,255,.70), transparent 55%), radial-gradient(900px 520px at 85% 20%, rgba(var(--primary),.22), transparent 60%), radial-gradient(900px 520px at 92% 85%, rgba(var(--primary),.14), transparent 60%), linear-gradient(180deg, rgba(255,255,255,.25), rgba(255,255,255,0))",
        }}
      />

      {/* soft blobs */}
      <svg
        className="absolute -left-44 -top-48 h-[640px] w-[640px] opacity-60 blur-[2px]"
        viewBox="0 0 600 600"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="g1" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
            <stop offset="45%" stopColor="rgba(255,255,255,0.25)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <circle cx="300" cy="300" r="260" fill="url(#g1)" />
      </svg>

      <svg
        className="absolute -right-52 top-10 h-[760px] w-[760px] opacity-70 blur-[3px]"
        viewBox="0 0 700 700"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="g2" cx="55%" cy="45%" r="70%">
            <stop offset="0%" stopColor="rgba(var(--primary),0.82)" />
            <stop offset="55%" stopColor="rgba(var(--primary),0.24)" />
            <stop offset="100%" stopColor="rgba(var(--primary),0)" />
          </radialGradient>
        </defs>
        <circle cx="350" cy="350" r="320" fill="url(#g2)" />
      </svg>

      <svg
        className="absolute left-[8%] bottom-[-320px] h-[820px] w-[820px] opacity-60 blur-[3px]"
        viewBox="0 0 760 760"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="g3" cx="45%" cy="55%" r="70%">
            <stop offset="0%" stopColor="rgba(var(--primary-2),0.44)" />
            <stop offset="55%" stopColor="rgba(var(--primary-2),0.14)" />
            <stop offset="100%" stopColor="rgba(var(--primary-2),0)" />
          </radialGradient>
        </defs>
        <circle cx="380" cy="380" r="340" fill="url(#g3)" />
      </svg>

      {/* subtle lines */}
      <svg
        className="absolute left-0 top-0 h-full w-full opacity-[0.18]"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ln" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="50%" stopColor="rgba(0,0,0,0.10)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        <path
          d="M-50 170 C 240 40, 420 480, 760 260 S 1150 210, 1300 420"
          fill="none"
          stroke="url(#ln)"
          strokeWidth="2"
        />
        <path
          d="M-60 520 C 240 320, 520 820, 820 520 S 1180 470, 1300 650"
          fill="none"
          stroke="url(#ln)"
          strokeWidth="2"
        />
      </svg>

      {/* grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.075]" aria-hidden="true">
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="
              1 0 0 0 0
              0 1 0 0 0
              0 0 1 0 0
              0 0 0 0.55 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
    </div>
  );
}

const FALLBACK_USER: SidebarUser = {
  fullName: "Player",
  userId: "-",
  clubName: "-",
  role: "Player",
  position: "",
};

export default function AppShell() {
  const navigate = useNavigate();
  const { data: meData, isLoading: userLoading, error: meError } = useMe();

  const [themeOpen, setThemeOpen] = useState(false);
  const [active, setActive] = useState<NavKey>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const user = useMemo<SidebarUser>(() => {
    if (!meData) return FALLBACK_USER;
    return mapToSidebarUser(meData as any);
  }, [meData]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!meError) return;
    const status = (meError as any)?.response?.status;
    if (status === 401 || status === 403) {
      clearAuth();
      navigate("/login", { replace: true });
      return;
    }
    console.error("Profile load failed (non-auth):", meError);
  }, [meError, navigate]);

  const subtitle = useMemo(() => {
    const map: Record<NavKey, string> = {
      dashboard: "Overview  -  readiness  -  schedule",
      squad: "Team  -  roles  -  availability",
      training: "Load  -  sessions  -  recovery",
      wearables: "HRV  -  GPS  -  sleep",
      contracts: "Contract  -  bonuses",
      calendar: "Matches  -  sessions",
      reviews: "Coach feedback",
      settings: "Preferences",
    };
    return map[active];
  }, [active]);

  const HEADER_H = 84;

  const roleAccess = useMemo(() => getDashboardRoleAccess(meData), [meData]);
  const isPlatformAdmin = !!meData?.isPlatformAdmin;
  const switchableRoles = roleAccess.availableRoles as DashboardRoleKey[];
  const canSwitchRole = roleAccess.canUseMultiRole && switchableRoles.length > 1;

  const dashboardRole = useMemo(() => {
    const stored = String(localStorage.getItem("activeDashboardRole") || "").toUpperCase() as DashboardRoleKey;
    if (switchableRoles.includes(stored)) return stored;
    return switchableRoles[0] || "PLAYER";
  }, [switchableRoles]);

  const dashboardHome = useMemo(() => {
    return pathForDashboardRole(dashboardRole as DashboardRole);
  }, [dashboardRole]);

  const topNav = useMemo(
    () => topNavByRole[dashboardRole] || defaultTopNav,
    [dashboardRole]
  );

  const sectionItems = useMemo(() => {
    const source = sectionItemsByRole[dashboardRole] || defaultSectionItems;
    if (source.some((item) => item.to === MARKETPLACE_SIDEBAR_ITEM.to)) {
      return source;
    }

    const settingsIndex = source.findIndex((item) => item.to === "/dashboard/settings");
    if (settingsIndex === -1) {
      return [...source, MARKETPLACE_SIDEBAR_ITEM];
    }

    return [
      ...source.slice(0, settingsIndex),
      MARKETPLACE_SIDEBAR_ITEM,
      ...source.slice(settingsIndex),
    ];
  }, [dashboardRole]);

  const sidebarItems: SidebarItem[] = useMemo(() => {
    const source = [{ label: "Dashboard", to: dashboardHome }, ...sectionItems];
    const seen = new Set<string>();
    return source.filter((item) => {
      if (seen.has(item.to)) return false;
      seen.add(item.to);
      return true;
    });
  }, [dashboardHome, sectionItems]);

  useEffect(() => {
    if (!topNav.some((item) => item.key === active)) {
      setActive(topNav[0]?.key ?? "dashboard");
    }
  }, [active, topNav]);

  useEffect(() => {
    localStorage.setItem("activeDashboardRole", dashboardRole);
  }, [dashboardRole]);

  const onSwitchRole = (nextRole: string) => {
    const normalized = String(nextRole || "").toUpperCase() as DashboardRoleKey;
    if (!switchableRoles.includes(normalized)) return;
    localStorage.setItem("activeDashboardRole", normalized);
    navigate(pathForDashboardRole(normalized as DashboardRole), { replace: true });
  };

  const requestLogout = () => {
    setLogoutConfirmOpen(true);
  };

  const logout = () => {
    setLogoutConfirmOpen(false);
    clearAuth();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-readable min-h-screen w-full bg-[rgb(var(--bg))]">
      <ThemePanel open={themeOpen} onClose={() => setThemeOpen(false)} />

      {/* backdrop under canvas */}
      <div className="relative">
        <GlassBackdrop />

        <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-6 sm:py-8">
          {/* CANVAS (no black border) */}
          <div
            className={cx(
              "relative overflow-hidden rounded-[28px]",
              "backdrop-blur-2xl",
              "shadow-[0_28px_80px_rgba(20,24,32,0.10)]"
            )}
            style={{
              background: GLASS_BG,
              border: `1px solid ${GLASS_BORDER}`,
              boxShadow: GLASS_SHADOW,
            }}
          >
            {/* glass highlight + subtle stroke */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.70), rgba(255,255,255,0.18) 55%, rgba(255,255,255,0.30))",
                opacity: 0.55,
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.20)",
              }}
            />

            {/* Layout */}
            <div className="relative z-10 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)]">
              {/* HEADER (glass, no dark divider) */}
              <header
                className="sticky top-0 z-20 backdrop-blur-2xl"
                style={{
                  height: HEADER_H,
                  background: "rgba(255,255,255,0.40)",
                  borderBottom: `1px solid ${GLASS_BORDER}`,
                }}
              >
                <div className="h-full px-4 sm:px-6">
                  <div className="flex h-full items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* mobile menu */}
                      <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                        style={{
                          background: "rgba(255,255,255,0.55)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        Menu
                      </button>

                      {/* brand pill */}
                      <div
                        className="rounded-full px-4 py-2 text-sm font-semibold"
                        style={{
                          background: "rgba(255,255,255,0.50)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        EsportM
                      </div>

                      {/* top pills */}
                      <nav
                        className="hidden items-center gap-1 rounded-full p-1 sm:flex"
                        style={{
                          background: "rgba(255,255,255,0.44)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        {topNav.map((item) => {
                          const on = item.key === active;
                          return (
                            <button
                              key={item.key}
                              onClick={() => setActive(item.key)}
                              className="rounded-full px-3 py-2 text-xs font-semibold transition"
                              style={{
                                background: on
                                  ? "rgba(var(--primary), .55)"
                                  : "transparent",
                                color: on
                                  ? "rgb(var(--primary-2))"
                                  : "rgb(var(--text))",
                                border: on
                                  ? `1px solid ${GLASS_BORDER_STRONG}`
                                  : "1px solid transparent",
                              }}
                            >
                              {item.label}
                            </button>
                          );
                        })}
                      </nav>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="hidden sm:block text-right">
                        <p className="text-sm font-semibold text-[rgb(var(--text))]">
                          EsportM  -  {userLoading ? "Loading..." : formatDashboardRole(dashboardRole as DashboardRole)}
                        </p>
                        <p className="text-xs text-[rgb(var(--muted))]">{subtitle}</p>
                      </div>

                      {canSwitchRole && (
                        <select
                          value={dashboardRole}
                          onChange={(event) => onSwitchRole(event.target.value)}
                          className="rounded-full px-3 py-2 text-xs font-semibold outline-none"
                          style={{
                            background: "rgba(255,255,255,0.50)",
                            color: "rgb(var(--text))",
                            border: `1px solid ${GLASS_BORDER}`,
                          }}
                          title="Switch authorized role context"
                        >
                          {switchableRoles.map((role) => (
                            <option key={role} value={role}>
                              {formatDashboardRole(role as DashboardRole)}
                            </option>
                          ))}
                        </select>
                      )}

                      {isPlatformAdmin && (
                        <button
                          onClick={() => navigate("/platform")}
                          className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                          style={{
                            background: "rgba(255,255,255,0.50)",
                            color: "rgb(var(--text))",
                            border: `1px solid ${GLASS_BORDER}`,
                          }}
                        >
                          Platform
                        </button>
                      )}

                      <button
                        onClick={() => setThemeOpen(true)}
                        className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                        style={{
                          background: "rgba(255,255,255,0.50)",
                          color: "rgb(var(--text))",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                      >
                        Theme
                      </button>

                      <div
                        className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold"
                        style={{
                          background: "rgba(255,255,255,0.48)",
                          border: `1px solid ${GLASS_BORDER}`,
                        }}
                        title={user.fullName}
                      >
                        {user.fullName?.trim()?.[0]?.toUpperCase() ?? "P"}
                      </div>
                    </div>
                  </div>
                </div>
              </header>

              {/* BODY */}
              <div className="flex h-[calc(100%-84px)] gap-4 px-4 py-4 sm:gap-6 sm:px-6 sm:py-6">
                {/* Desktop sticky sidebar (glass) */}
                <div className="hidden md:block shrink-0" style={{ width: 220 }}>
                  <div className="sticky top-[96px]">
                    <Sidebar
                      open={sidebarOpen}
                      onClose={() => setSidebarOpen(false)}
                      items={sidebarItems}
                      user={user}
                    />
                  </div>
                </div>

                {/* Mobile drawer */}
                <div className="md:hidden">
                  <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    items={sidebarItems}
                    user={user}
                  />
                </div>

                {/* Scroll only main */}
                <main className="min-w-0 flex-1 overflow-y-auto pr-1">
                  {/* quick actions (mobile) */}
                  <div className="mb-4 flex justify-end gap-2 sm:hidden">
                    <button
                      onClick={() => navigate("/")}
                      className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:bg-white/70"
                      style={{
                        background: "rgba(255,255,255,0.50)",
                        border: `1px solid ${GLASS_BORDER}`,
                      }}
                    >
                      Home
                    </button>

                    <button
                      onClick={requestLogout}
                      className="rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition hover:opacity-95"
                      style={{
                        background: "rgba(var(--primary), .65)",
                        color: "rgb(var(--primary-2))",
                        border: `1px solid ${GLASS_BORDER_STRONG}`,
                      }}
                    >
                      Logout
                    </button>
                  </div>

                  {/* Optional: small loading ribbon */}
                  {userLoading && (
                    <div
                      className="mb-3 rounded-2xl border bg-white/50 px-4 py-3 text-sm backdrop-blur-md"
                      style={{ borderColor: "rgba(var(--primary-2), .10)" }}
                    >
                      Loading profile...
                    </div>
                  )}

                  <Outlet />
                </main>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={logoutConfirmOpen}
        title="Log out?"
        message="You will need to sign in again to access your dashboard."
        confirmText="Logout"
        cancelText="Cancel"
        onCancel={() => setLogoutConfirmOpen(false)}
        onConfirm={logout}
      />
    </div>
  );
}




