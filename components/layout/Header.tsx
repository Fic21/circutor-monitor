
import { Activity, Radio } from "lucide-react";

export default function Header() {
  return (
    <header className="relative w-full overflow-hidden rounded-2xl border border-cyan-500/20 bg-[#0b1423] shadow-[0_0_30px_rgba(6,182,212,0.06)]">

      {/* Background effects */}
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

      <div className="relative flex min-h-[100px] w-full items-center justify-between gap-4 px-5 py-5 sm:px-7 lg:px-8">

        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-400/10 sm:h-12 sm:w-12">
            <Activity
              size={24}
              className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"
            />
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-base font-black tracking-[0.08em] text-white sm:text-xl sm:tracking-[0.12em]">
              CIRCUTOR<span className="text-cyan-400">-MONITOR</span>
            </h1>

            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-px w-5 shrink-0 bg-cyan-400" />
              <p className="truncate text-[9px] font-semibold tracking-[0.18em] text-slate-400 sm:text-[10px] sm:tracking-[0.25em]">
                INDUSTRIAL ENERGY MONITORING
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex shrink-0 items-center gap-2 border-l border-slate-700/70 pl-3 sm:gap-3 sm:pl-6">
          <div className="hidden text-right sm:block">
            <p className="text-[9px] tracking-[0.25em] text-slate-500">
              DEVELOPED BY
            </p>
            <p className="mt-1 text-sm font-bold tracking-[0.2em] text-cyan-300">
              FIKRA
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-800/70">
            <Radio size={17} className="text-cyan-400" />
          </div>
        </div>
      </div>

      {/* Bottom accent */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
    </header>
  );
}
