
import {
  Search,
  Sparkles,
  MessageSquareText,
  ShoppingBag,
  Briefcase,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";


export default function Home() {
    const navigate = useNavigate();
  return (
    <div className="min-h-screen w-full bg-[#E7E9FF]">
      <div className="mx-auto max-w-[1500px] px-3 py-6 sm:px-6 sm:py-10">
        {/* ✅ Mobile-first: stack -> md+ row */}
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {/* LEFT COLUMN */}
          {/* ✅ On mobile: turn into a horizontal pill bar */}
          <div className="flex items-center justify-between gap-3 md:flex-col md:items-center md:justify-start md:gap-3">
            {/* Main nav pill */}
            <div className="flex h-[76px] w-full items-center justify-between rounded-[28px] bg-black px-5 shadow-[0_18px_40px_rgba(0,0,0,0.25)]
                            md:h-[610px] md:w-[92px] md:flex-col md:items-center md:justify-between md:rounded-[48px] md:px-0 md:py-10">
              <div className="flex items-center gap-6 text-white md:flex-col md:gap-10">
                <Sparkles className="h-6 w-6 md:h-7 md:w-7" />
                <MessageSquareText className="h-6 w-6 md:h-7 md:w-7" />
                <ShoppingBag className="h-6 w-6 md:h-7 md:w-7" />
                <Briefcase className="h-6 w-6 md:h-7 md:w-7" />
              </div>
              <Info className="h-6 w-6 text-white md:h-7 md:w-7" />
            </div>

            {/* Profile + Demo pill */}
            <div className="flex h-[76px] w-[150px] items-center justify-center gap-4 rounded-[28px] bg-[#B8BEFF] shadow-[0_16px_34px_rgba(0,0,0,0.18)]
                            md:h-[165px] md:w-[92px] md:flex-col md:gap-6 md:rounded-[46px]">
              <button
              onClick={() => navigate("/login")}
                className="grid h-11 w-11 place-items-center rounded-full bg-[#E7E9FF] shadow-[0_12px_22px_rgba(0,0,0,0.58)] active:scale-[0.98] md:h-12 md:w-12"
                title="Profile"
              >
                <span className="text-[10px] font-semibold tracking-wider md:text-[11px]">
                  Login
                </span>
              </button>

              <button
                className="grid h-11 w-11 place-items-center rounded-full bg-[#E7E9FF] shadow-[0_12px_22px_rgba(0,0,0,0.58)] active:scale-[0.98] md:h-12 md:w-12"
                title="Demo"
              >
                <span className="text-[10px] font-semibold tracking-wider md:text-[11px]">
                  DEMO
                </span>
              </button>
            </div>
          </div>

          {/* MAIN CONTENT GRID */}
          {/* ✅ Mobile: stack hero + right cards */}
          <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:gap-6">
            {/* CENTER HERO */}
            <div className="relative flex-1">
              <div
                className="relative h-[520px] overflow-hidden rounded-[34px] bg-[#5D5FA8] shadow-[0_28px_60px_rgba(0,0,0,0.22)]
                           sm:h-[620px] sm:rounded-[44px]
                           md:h-[720px]
                           lg:h-[787px] lg:rounded-[54px]"
              >
                {/* Text */}
                <div
                  className="absolute right-6 top-10 text-[#E7E9FF]
                             sm:right-10 sm:top-14
                             md:right-14 md:top-20
                             lg:right-[120px] lg:top-[245px]"
                >
                  <div className="text-[52px] font-semibold leading-[0.95] tracking-wide sm:text-[72px] md:text-[92px] lg:text-[120px]">
                    EsportM
                  </div>
                  <div className="mt-4 max-w-[320px] text-[14px] font-semibold leading-snug text-[#E7E9FF]/90 sm:text-[18px] md:text-[20px] lg:mt-6 lg:text-[22px]">
                    Electronic Sports Management <br /> system
                  </div>
                </div>

                {/* Player image */}
                <img
                  src="/images/player.png"
                  alt="EsportM player"
                  className="absolute bottom-[-160px] left-1/2 w-[220px] -translate-x-1/2 select-none drop-shadow-[0_35px_60px_rgba(0,0,0,0.35)]
                             sm:w-[420px]
                             md:w-[480px] md:left-[70px] md:translate-x-0
                             lg:left-[120px] lg:w-[520px]"
                  draggable={false}
                />
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex w-full flex-col gap-4 lg:w-[430px] lg:gap-3">
              {/* Top purple card with search */}
              <div className="relative h-[360px] rounded-[34px] bg-[#5D5FA8] shadow-[0_28px_60px_rgba(0,0,0,0.22)]
                              sm:h-[420px] sm:rounded-[44px]
                              md:h-[520px]
                              lg:h-[560px] lg:rounded-[54px]">
                <button className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-black px-4 py-2.5 text-white shadow-[0_14px_30px_rgba(0,0,0,0.25)] active:scale-[0.99] sm:right-7 sm:top-7 sm:px-5 sm:py-3">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-[14px] font-medium sm:text-[16px]">
                    Search
                  </span>
                </button>

                <div className="absolute bottom-5 left-7 text-[14px] font-light text-white/80 sm:bottom-6 sm:left-10 sm:text-[18px]">
                  AI powered
                </div>
              </div>

              {/* Bottom gray events card */}
              <div className="relative h-[190px] rounded-[28px] bg-[#6E707C] shadow-[0_28px_60px_rgba(0,0,0,0.22)]
                              sm:h-[210px] sm:rounded-[34px]
                              lg:h-[215px] lg:rounded-[40px]">
                <div className="absolute left-7 top-7 text-[#E7E9FF] sm:left-10 sm:top-10">
                  <div className="text-[22px] font-medium sm:text-[28px]">
                    EsportM
                  </div>
                  <div className="text-[14px] font-light opacity-80 sm:text-[18px]">
                    Events
                  </div>
                </div>

                {/* Ring */}
                <div className="absolute right-7 top-1/2 -translate-y-1/2 sm:right-10">
                  <div className="h-[86px] w-[86px] rounded-full bg-gradient-to-br from-[#A8B0FF] via-[#6E66D3] to-[#3C3F7C] p-[12px] shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:h-[112px] sm:w-[112px] sm:p-[16px]">
                    <div className="h-full w-full rounded-full bg-[#6E707C]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END MAIN CONTENT GRID */}
        </div>
      </div>
    </div>
  );
}
