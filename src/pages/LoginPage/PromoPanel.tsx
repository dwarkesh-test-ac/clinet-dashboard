import type { Icon } from "@phosphor-icons/react";
import { Brain, ChartBar, GpsFix, MapTrifold, ShieldCheck, TrendUp } from "@phosphor-icons/react";
import logoMark from "../../assets/navyug-mark.png";

const PILLS = [
  { icon: GpsFix, label: "Real-time GPS Tracking" },
  { icon: Brain, label: "Driver Behaviour AI" },
  { icon: ChartBar, label: "KPI Reports" },
  { icon: ShieldCheck, label: "Anti-Theft Alerts" },
];

// Layered radial-gradient "patches" of forest/field/scrub tones over a base terrain
// gradient, standing in for real satellite tile texture (no live tiles in this static promo mockup).
const MAP_BG = [
  "radial-gradient(ellipse 55% 40% at 18% 22%, rgba(51,74,45,.85), transparent 70%)",
  "radial-gradient(ellipse 45% 35% at 78% 18%, rgba(100,118,72,.8), transparent 70%)",
  "radial-gradient(ellipse 50% 45% at 85% 74%, rgba(40,58,38,.85), transparent 70%)",
  "radial-gradient(ellipse 42% 30% at 24% 84%, rgba(140,126,84,.5), transparent 70%)",
  "radial-gradient(ellipse 36% 42% at 52% 46%, rgba(66,84,52,.75), transparent 70%)",
  "linear-gradient(rgba(6,10,18,.3),rgba(6,10,18,.3))",
  "linear-gradient(135deg, #6c8760 0%, #52704d 45%, #33502f 100%)",
].join(",");

const MAP_GRID = "repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0px, rgba(255,255,255,.05) 1px, transparent 1px, transparent 14px), repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0px, rgba(255,255,255,.05) 1px, transparent 1px, transparent 14px)";

function LiveMapMini({ className }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-md ${className ?? ""}`} style={{ background: MAP_BG }}>
      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: MAP_GRID }} />
      <svg viewBox="0 0 400 340" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path
          d="M20 300 C 90 250, 140 160, 220 170 S 340 250, 380 100"
          fill="none"
          stroke="#0B1220"
          strokeOpacity=".5"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="M20 300 C 90 250, 140 160, 220 170 S 340 250, 380 100"
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          className="animate-draw-line"
        />
      </svg>
      <span className="absolute left-[16px] top-[280px] block h-[11px] w-[11px]">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#16A34A]/70" />
        <span className="absolute inset-0 rounded-full border-2 border-white bg-[#16A34A] shadow" />
      </span>
      <span className="absolute right-[14px] top-[88px] block h-[11px] w-[11px]">
        <span className="absolute inset-0 animate-ping rounded-full bg-[#EF4444]/70" style={{ animationDelay: ".7s" }} />
        <span className="absolute inset-0 rounded-full border-2 border-white bg-[#EF4444] shadow" />
      </span>
      <div className="absolute left-2 top-[7px] rounded-md bg-white px-[7px] py-[3px] font-sans text-[7.5px] font-bold text-ink shadow">
        Live Map
      </div>
      <div className="absolute bottom-[7px] left-2 max-w-[130px] rounded-md bg-navy/85 px-[7px] py-[3px] font-sans text-[6.5px] font-semibold text-[#FCA5A5]">
        NVG-86413-B · Battery temp high
      </div>
    </div>
  );
}

interface FloatingChipProps {
  icon: Icon;
  label: string;
  tone?: "brand" | "success";
  className?: string;
  delay?: string;
}

function FloatingChip({ icon: Icon, label, tone = "brand", className, delay = "0s" }: FloatingChipProps) {
  const toneClass = tone === "success" ? "text-[#4ADE80]" : "text-[#60A5FA]";
  return (
    <div
      className={`absolute z-20 flex animate-fade-up items-center gap-1.5 rounded-full border border-white/15 bg-[#151d33]/90 px-3 py-1.5 shadow-[0_12px_28px_rgba(0,0,0,.45)] backdrop-blur-sm ${className ?? ""}`}
      style={{ animationDelay: delay }}
    >
      <span className="flex animate-float-sm items-center" style={{ animationDelay: delay }}>
        <Icon size={13} weight="fill" className={toneClass} />
      </span>
      <span className="whitespace-nowrap font-sans text-[10px] font-bold text-white">{label}</span>
    </div>
  );
}

export function PromoPanel() {
  return (
    <div className="relative hidden flex-1 flex-col items-center justify-center gap-6 overflow-hidden px-10 py-10 text-white lg:flex">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -left-24 top-6 h-72 w-72 animate-blob rounded-full bg-brand/25 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-80 w-80 animate-blob-slow rounded-full bg-success/15 blur-3xl" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 animate-blob rounded-full bg-[#F59E0B]/10 blur-3xl" style={{ animationDelay: "4s" }} />
        <div
          className="absolute inset-0 opacity-[.05]"
          style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,.7) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[540px] animate-fade-up text-center">
        <h1 className="font-sans text-[25px] font-bold leading-tight tracking-tight text-white">
          One dashboard for your entire fleet
        </h1>
        <p className="mx-auto mt-2 max-w-[420px] font-sans text-[13px] font-medium leading-relaxed text-white/60">
          Real-time GPS tracking, driver behaviour analysis and KPI reporting — streamed from
          hardware built for Indian roads.
        </p>
      </div>

      {/* Laptop + phone mockup */}
      <div className="relative z-10 w-full max-w-[540px] animate-float-slow" style={{ animationDelay: ".15s" }}>
        <div className="absolute -inset-6 -z-10 animate-glow rounded-[28px] bg-brand/25 blur-2xl" aria-hidden />

        <div
          className="rounded-t-2xl rounded-b-[5px] p-3.5 pb-2.5"
          style={{ background: "linear-gradient(#1b2334,#0d1320)", boxShadow: "0 40px 90px rgba(0,0,0,.55)" }}
        >
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-[#F8FAFC]">
            <div className="absolute inset-0 flex">
              <div className="flex w-[52px] shrink-0 flex-col items-center gap-3.5 bg-navy py-3">
                <img src={logoMark} alt="" className="h-5 w-5 object-contain" />
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md bg-brand">
                  <MapTrifold size={11} weight="fill" className="text-white" />
                </span>
                <span className="flex h-[22px] w-[22px] items-center justify-center text-[#6B7280]">
                  <svg viewBox="0 0 16 16" className="h-[11px] w-[11px]" fill="currentColor"><rect x="1" y="6" width="10" height="6" rx="1" /><circle cx="4" cy="13" r="1.5" /><circle cx="10" cy="13" r="1.5" /></svg>
                </span>
                <span className="flex h-[22px] w-[22px] items-center justify-center text-[#6B7280]">
                  <svg viewBox="0 0 16 16" className="h-[11px] w-[11px]" fill="currentColor"><circle cx="8" cy="5" r="3" /><path d="M2 14c0-3 2.5-5 6-5s6 2 6 5" /></svg>
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex h-8 shrink-0 items-center border-b border-line-soft bg-white px-3.5">
                  <span className="font-sans text-[11px] font-bold text-ink">Fleet Overview</span>
                  <span className="ml-auto flex items-center gap-1.5 font-mono text-[8px] font-semibold text-[#16A34A]">
                    <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-[#16A34A]" />
                    LIVE
                  </span>
                  <span className="ml-2.5 h-4 w-4 rounded-full bg-navy" />
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-[1.35fr_1fr] grid-rows-2 gap-1.5 bg-surface-app p-1.5">
                  <LiveMapMini className="row-span-2" />
                  <div className="flex min-w-0 flex-col justify-center rounded-md bg-white px-2.5 py-1.5">
                    <div className="font-sans text-[7px] font-bold text-ink">Driving Score Trend</div>
                    <svg viewBox="0 0 130 40" className="mt-1 h-[26px] w-full">
                      <polyline
                        points="0,30 20,26 40,28 60,16 80,20 100,8 130,12"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="2"
                        pathLength={1}
                        strokeDasharray={1}
                        className="animate-draw-line"
                        style={{ animationDelay: ".3s" }}
                      />
                    </svg>
                    <div className="mt-0.5 flex items-baseline gap-1">
                      <span className="font-sans text-[13px] font-bold text-ink">87</span>
                      <span className="font-mono text-[6px] font-semibold text-[#16A34A]">Good</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 content-center gap-1.5 rounded-md bg-white px-2.5 py-1.5">
                    <div>
                      <div className="font-mono text-[6px] font-bold uppercase tracking-wider text-ink-faint">Active</div>
                      <div className="font-sans text-[11px] font-bold text-ink">42</div>
                    </div>
                    <div>
                      <div className="font-mono text-[6px] font-bold uppercase tracking-wider text-ink-faint">Alerts</div>
                      <div className="font-sans text-[11px] font-bold text-[#F59E0B]">1</div>
                    </div>
                    <div>
                      <div className="font-mono text-[6px] font-bold uppercase tracking-wider text-ink-faint">Idle</div>
                      <div className="font-sans text-[11px] font-bold text-ink">6</div>
                    </div>
                    <div>
                      <div className="font-mono text-[6px] font-bold uppercase tracking-wider text-ink-faint">Moving</div>
                      <div className="font-sans text-[11px] font-bold text-[#16A34A]">36</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center pt-2">
            <span className="h-[5px] w-[5px] rounded-full bg-[#3a445c]" />
          </div>
        </div>
        <div
          className="relative -mx-2 h-4 rounded-b-[10px]"
          style={{ background: "linear-gradient(#2b3346,#12161f)", boxShadow: "0 14px 24px rgba(0,0,0,.4)" }}
        >
          <div className="absolute left-1/2 top-0 h-1.5 w-[15%] -translate-x-1/2 rounded-b-md bg-[#0b0e15]" />
        </div>
        <div className="mx-8 h-6" style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,.4), rgba(0,0,0,0) 72%)" }} />

        {/* Phone mockup, overlapping bottom-left */}
        <div
          className="absolute -bottom-1 left-[-6%] w-[26%] animate-float-sm"
          style={{ filter: "drop-shadow(0 20px 24px rgba(0,0,0,.5))", animationDelay: ".8s" }}
        >
          <div className="rounded-[20px] bg-[#111827] p-[7px]" style={{ aspectRatio: "9/19", boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.08)" }}>
            <div className="relative flex h-full w-full flex-col overflow-hidden rounded-[14px] bg-white">
              <div className="absolute left-1/2 top-[5px] z-10 h-1 w-[32%] -translate-x-1/2 rounded-sm bg-[#111827]" />
              <div className="flex shrink-0 items-center gap-1 bg-white px-2 pb-1 pt-3.5">
                <img src={logoMark} alt="" className="h-[9px] w-[9px] object-contain" />
                <span className="font-sans text-[6.5px] font-bold text-ink">Navyug</span>
                <span className="ml-auto h-[5px] w-[5px] animate-pulse-dot rounded-full bg-[#16A34A]" />
              </div>
              <div className="mx-1.5 mt-1 grid shrink-0 grid-cols-2 gap-1 rounded-[5px] bg-surface-app px-1.5 py-1">
                <div>
                  <div className="font-mono text-[4.5px] font-bold uppercase tracking-wider text-ink-faint">Uptime</div>
                  <div className="font-sans text-[9px] font-bold text-ink">99.7%</div>
                </div>
                <div>
                  <div className="font-mono text-[4.5px] font-bold uppercase tracking-wider text-ink-faint">Alerts</div>
                  <div className="font-sans text-[9px] font-bold text-[#F59E0B]">1</div>
                </div>
              </div>
              <div className="mx-1.5 mb-1 mt-1 shrink-0 rounded-[5px] bg-surface-app px-1.5 py-1">
                <div className="font-mono text-[4.5px] font-bold uppercase tracking-wider text-ink-faint">Driving Score</div>
                <svg viewBox="0 0 100 24" className="mt-0.5 h-[14px] w-full">
                  <polyline
                    points="0,18 15,15 30,17 45,9 60,12 75,4 100,7"
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="1.6"
                    pathLength={1}
                    strokeDasharray={1}
                    className="animate-draw-line"
                    style={{ animationDelay: ".9s" }}
                  />
                </svg>
              </div>
              <LiveMapMini className="mx-1.5 mb-1.5 flex-1" />
              <div className="flex shrink-0 justify-around border-t border-line-soft py-1.5">
                <MapTrifold size={9} weight="fill" className="text-brand" />
                <svg viewBox="0 0 16 16" className="h-[9px] w-[9px] text-ink-faint" fill="currentColor"><rect x="1" y="6" width="10" height="6" rx="1" /></svg>
                <svg viewBox="0 0 16 16" className="h-[9px] w-[9px] text-ink-faint" fill="currentColor"><path d="M8 1a4 4 0 00-4 4v3l-1.5 3h11L12 8V5a4 4 0 00-4-4z" /></svg>
                <svg viewBox="0 0 16 16" className="h-[9px] w-[9px] text-ink-faint" fill="currentColor"><circle cx="8" cy="5" r="3" /></svg>
              </div>
            </div>
          </div>
        </div>

        <FloatingChip icon={GpsFix} label="142 vehicles live" tone="success" className="-top-4 right-3" delay=".5s" />
        <FloatingChip icon={TrendUp} label="Driving score +12%" tone="brand" className="bottom-16 -right-3" delay=".75s" />
      </div>

      <div className="relative z-10 mt-2 flex flex-wrap justify-center gap-2.5">
        {PILLS.map((p, i) => (
          <span
            key={p.label}
            className="inline-flex animate-fade-up items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-[13px] py-[7px] font-sans text-[10.5px] font-semibold text-[#E5E7EB] transition-colors hover:border-brand/40 hover:bg-white/[.1]"
            style={{ animationDelay: `${0.5 + i * 0.08}s` }}
          >
            <p.icon size={13} weight="fill" className="text-brand" />
            {p.label}
          </span>
        ))}
      </div>
    </div>
  );
}
