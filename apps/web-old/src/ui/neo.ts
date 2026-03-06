export const neo = {
  page: "bg-[#E7E9FF] text-slate-800",
  // soft background glow (no images)
  bgFx:
    "bg-[radial-gradient(900px_600px_at_20%_10%,rgba(255,255,255,0.85),transparent_55%),radial-gradient(800px_520px_at_90%_15%,rgba(120,130,255,0.18),transparent_60%),linear-gradient(180deg,#E7E9FF_0%,#E9EAFF_35%,#E7E9FF_100%)]",

  // neumorphism surfaces
  card:
    "rounded-3xl bg-[#E7E9FF] shadow-[12px_12px_28px_rgba(120,120,180,0.28),-12px_-12px_28px_rgba(255,255,255,0.90)]",
  cardSm:
    "rounded-2xl bg-[#E7E9FF] shadow-[10px_10px_22px_rgba(120,120,180,0.22),-10px_-10px_22px_rgba(255,255,255,0.92)]",
   inset:
    "bg-[#E7E9FF] shadow-[inset_6px_6px_12px_rgba(120,120,180,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.92)]",

  // buttons
  btn:
    "rounded-full bg-[#E7E9FF] shadow-[10px_10px_22px_rgba(120,120,180,0.25),-10px_-10px_22px_rgba(255,255,255,0.92)] " +
    "active:shadow-[inset_8px_8px_16px_rgba(120,120,180,0.22),inset_-8px_-8px_16px_rgba(255,255,255,0.92)] transition",

  // primary button (yellow from your ref)
  btnPrimary:
    "rounded-full bg-[#E9E86A] text-slate-900 shadow-[10px_10px_22px_rgba(120,120,180,0.24),-10px_-10px_22px_rgba(255,255,255,0.75)] " +
    "active:shadow-[inset_8px_8px_16px_rgba(0,0,0,0.14),inset_-8px_-8px_16px_rgba(255,255,255,0.35)] transition",

  muted: "text-slate-500",

  raised:
    "bg-[#E7E9FF] shadow-[10px_10px_24px_rgba(120,120,180,0.22),-10px_-10px_24px_rgba(255,255,255,0.92)]",
};