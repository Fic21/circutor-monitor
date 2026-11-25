
"use client";

import { useDashboardData } from "@/hooks/useDashboardData";

type Measurement = {
  Name: string;
  Instantaneous: string;
};

type DeviceStep = {
  Step: number;
  Counter: number;
  Status: string;
};

type StepsData = {
  OperatingHours?: number;
  Steps?: DeviceStep[];
};

const measurementConfig: Record<
  string,
  { label: string; unit: string; icon: string; description: string }
> = {
  Voltage: { label: "Voltage", unit: "V", icon: "ϟ", description: "Tegangan listrik" },
  Current: { label: "Current", unit: "A", icon: "∿", description: "Arus listrik" },
  ActivePower: { label: "Active Power", unit: "kW", icon: "⚡", description: "Daya aktif" },
  ReactivePower: { label: "Reactive Power", unit: "kVAr", icon: "◒", description: "Daya reaktif" },
  ApparentPower: { label: "Apparent Power", unit: "kVA", icon: "◈", description: "Daya semu" },
  CosPhi: { label: "Power Factor", unit: "", icon: "φ", description: "Faktor daya" },
  THDv: { label: "Voltage THD", unit: "%", icon: "〰", description: "Distorsi harmonisa tegangan" },
  THDi: { label: "Current THD", unit: "%", icon: "∿", description: "Distorsi harmonisa arus" },
  Frequency: { label: "Frequency", unit: "Hz", icon: "◷", description: "Frekuensi listrik" },
};

// ==========================================
// HELPERS
// ==========================================

function getMeasurements(raw: unknown): Measurement[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(
    (item): item is Measurement =>
      typeof item === "object" &&
      item !== null &&
      "Name" in item &&
      "Instantaneous" in item
  );
}

function formatValue(value: string | number) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number.toLocaleString("id-ID", { maximumFractionDigits: 2 })
    : String(value);
}

function isStatusActive(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;

  if (typeof value === "string") {
    return ["ON", "ACTIVE", "TRUE", "1", "ALARM", "ACTIVATED"].includes(
      value.trim().toUpperCase()
    );
  }

  return false;
}

// ==========================================
// DEVICE STEPS
// ==========================================

function StepsPanel({
  data,
  onMouseEnter,
  onMouseLeave,
}: {
  data: unknown;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const stepsData = data as StepsData | null;
  const steps = Array.isArray(stepsData?.Steps) ? stepsData.Steps : [];
  const operatingHours = stepsData?.OperatingHours ?? 0;

  const activeCount = steps.filter(
    (step) => String(step.Status).toUpperCase() === "ON"
  ).length;

  return (
    <section
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-5 shadow-xl"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

      {/* HEADER */}
      <div className="relative flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
            <h2 className="font-bold tracking-wide text-white">
              Device Steps
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Capacitor switching sequence
          </p>
        </div>

        <div className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-center">
          <p className="text-xl font-bold text-emerald-400">
            {activeCount}/{steps.length}
          </p>
          <p className="text-[9px] tracking-widest text-slate-400">
            ACTIVE STEPS
          </p>
        </div>
      </div>

      {/* OPERATING HOURS */}
      <div className="relative mt-5 border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-blue-500/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400">
              TOTAL OPERATING HOURS
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-bold text-cyan-400">
                {formatValue(operatingHours)}
              </span>
              <span className="text-sm text-slate-400">Hours</span>
            </div>
          </div>

          <div className="flex h-12 w-12 items-center justify-center border border-cyan-500/20 bg-cyan-500/10 text-2xl text-cyan-400">
            ◷
          </div>
        </div>
      </div>

      {/* STEP SEQUENCE - HORIZONTAL */}
      <div className="relative mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-slate-300">
            STEP SEQUENCE
          </p>
          <p className="text-[10px] text-slate-500">
            {steps.length} TOTAL STEPS
          </p>
        </div>

        {steps.length > 0 ? (
          <div className="flex w-full gap-3 overflow-x-auto pb-3">
            {steps.map((step) => {
              const active = String(step.Status).toUpperCase() === "ON";

              return (
                <div
                  key={step.Step}
                  className={`relative min-w-[125px] flex-1 border p-3 transition-all duration-300 ${
                    active
                      ? "border-emerald-400/50 bg-emerald-400/[0.08] shadow-[0_0_15px_rgba(52,211,153,0.08)]"
                      : "border-slate-700 bg-[#0b1423]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest text-slate-500">
                      STEP {String(step.Step).padStart(2, "0")}
                    </span>

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        active
                          ? "animate-pulse bg-emerald-400 shadow-[0_0_10px_#34d399]"
                          : "bg-slate-600"
                      }`}
                    />
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] tracking-widest text-slate-500">
                      COUNTER
                    </p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {formatValue(step.Counter)}
                    </p>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-700/70 pt-3">
                    <span className="text-[10px] text-slate-500">
                      STATUS
                    </span>

                    <span
                      className={`text-[10px] font-bold tracking-widest ${
                        active ? "text-emerald-400" : "text-slate-500"
                      }`}
                    >
                      {step.Status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            No step data available
          </div>
        )}
      </div>
    </section>
  );
}

// ==========================================
// DEVICE ALARMS
// ==========================================

type AlarmItem = {
  name: string;
  active: boolean;
};

function getAlarmItems(raw: unknown): AlarmItem[] {
  if (raw === null || raw === undefined) return [];

  const records: Record<string, unknown>[] = [];

  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        records.push(item as Record<string, unknown>);
      } else {
        records.push({ Value: item });
      }
    });
  } else if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    const arrays = Object.entries(obj).filter(
      ([, value]) => Array.isArray(value)
    );

    if (arrays.length > 0) {
      arrays.forEach(([groupName, value]) => {
        (value as unknown[]).forEach((item, index) => {
          if (typeof item === "object" && item !== null) {
            records.push({
              Group: groupName,
              ...(item as Record<string, unknown>),
            });
          } else {
            records.push({
              Name: `${groupName} ${index + 1}`,
              Value: item,
            });
          }
        });
      });
    } else {
      records.push(obj);
    }
  }

  return records.map((record, index) => {
    const name = String(
      record.Name ??
      record.name ??
      record.Alarm ??
      record.alarm ??
      record.Description ??
      record.description ??
      record.Code ??
      `Alarm ${index + 1}`
    );

    const status =
      record.Status ??
      record.status ??
      record.State ??
      record.state ??
      record.Active ??
      record.active ??
      record.Value ??
      record.value;

    return {
      name,
      active: isStatusActive(status),
    };
  });
}

function AlarmPanel({
  data,
  onMouseEnter,
  onMouseLeave,
}: {
  data: unknown;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const alarms = getAlarmItems(data);
  const activeCount = alarms.filter((alarm) => alarm.active).length;

  return (
    <section
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-5 shadow-xl"
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-red-500/10 blur-3xl" />

      {/* HEADER */}
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400 shadow-[0_0_12px_#f87171]" />
            <h2 className="font-bold tracking-wide text-white">
              Device Alarms
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Fault detection and protection monitoring
          </p>
        </div>

        <div
          className={`border px-4 py-2 text-center ${
            activeCount > 0
              ? "border-red-500/40 bg-red-500/10"
              : "border-emerald-500/30 bg-emerald-500/10"
          }`}
        >
          <p
            className={`text-xl font-bold ${
              activeCount > 0 ? "text-red-400" : "text-emerald-400"
            }`}
          >
            {activeCount}
          </p>
          <p className="text-[9px] tracking-widest text-slate-400">
            ACTIVE
          </p>
        </div>
      </div>

      {/* ALARM SUMMARY */}
      <div className="relative mt-5 grid grid-cols-2 gap-3">
        <div className="border border-slate-700 bg-[#0b1423] p-3">
          <p className="text-[10px] tracking-widest text-slate-500">
            TOTAL ALARMS
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {alarms.length}
          </p>
        </div>

        <div className="border border-slate-700 bg-[#0b1423] p-3">
          <p className="text-[10px] tracking-widest text-slate-500">
            NORMAL
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">
            {alarms.length - activeCount}
          </p>
        </div>
      </div>

      {/* ALARM SEQUENCE - HORIZONTAL */}
      <div className="relative mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-slate-300">
            ALARM MONITORING
          </p>
          <p className="text-[10px] text-slate-500">
            {alarms.length} TOTAL ALARMS
          </p>
        </div>

        {alarms.length > 0 ? (
          <div className="flex w-full gap-3 overflow-x-auto pb-3">
            {alarms.map((alarm, index) => (
              <div
                key={`${alarm.name}-${index}`}
                className={`flex min-w-[125px] flex-1 items-center justify-between gap-3 border p-3 transition-all duration-300 ${
                  alarm.active
                    ? "border-red-500/50 bg-red-500/[0.08] shadow-[0_0_15px_rgba(239,68,68,0.08)]"
                    : "border-slate-700 bg-[#0b1423]"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-bold tracking-widest text-slate-500">
                    ALARM {String(index + 1).padStart(2, "0")}
                  </p>

                  <p className="mt-2 truncate text-sm font-semibold text-white">
                    {alarm.name}
                  </p>

                  <p
                    className={`mt-2 text-[10px] font-bold tracking-widest ${
                      alarm.active ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {alarm.active ? "ACTIVE" : "NORMAL"}
                  </p>
                </div>

                <span
                  className={`h-3 w-3 shrink-0 rounded-full ${
                    alarm.active
                      ? "animate-pulse bg-red-400 shadow-[0_0_10px_#f87171]"
                      : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  }`}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
            No alarm data available
          </div>
        )}
      </div>

      {/* ALARM WARNING */}
      {activeCount > 0 && (
        <div className="relative mt-4 flex items-center gap-3 border border-red-500/40 bg-red-500/10 p-3">
          <span className="h-3 w-3 animate-ping rounded-full bg-red-500" />
          <div>
            <p className="text-xs font-bold tracking-wider text-red-400">
              ACTIVE ALARM DETECTED
            </p>
            <p className="mt-1 text-[10px] text-red-300/70">
              {activeCount} alarm(s) require attention
            </p>
          </div>
        </div>
      )}

      {alarms.length > 0 && activeCount === 0 && (
        <div className="relative mt-4 flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 p-3">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
          <p className="text-xs font-bold tracking-wider text-emerald-400">
            ALL SYSTEMS NORMAL
          </p>
        </div>
      )}
    </section>
  );
}

// ==========================================
// MAIN DASHBOARD
// ==========================================

export default function DashboardPage() {
  const {
    data,
    status,
    startStepsPolling,
    stopStepsPolling,
    startAlarmsPolling,
    stopAlarmsPolling,
  } = useDashboardData();

  const measurements = getMeasurements(data.measurements);
  const isConnected = !status.error && !status.loading;

  return (
    <main className="min-h-screen space-y-7 bg-[#080f1c] p-4 text-white sm:p-6 lg:p-8">

      {/* HEADER */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.3em] text-cyan-400">
            CIRCUTOR / INDUSTRIAL MONITORING
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Power <span className="text-cyan-400">Dashboard</span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Real-time electrical monitoring and device diagnostics
          </p>
        </div>

        <div className="flex items-center gap-3 border border-slate-700 bg-[#101b2d] px-5 py-3">
          <span
            className={`h-3 w-3 rounded-full ${
              isConnected
                ? "animate-pulse bg-emerald-400 shadow-[0_0_12px_3px_rgba(52,211,153,0.4)]"
                : "bg-red-500"
            }`}
          />

          <div>
            <p className="text-sm font-bold">
              {status.loading
                ? "CONNECTING"
                : status.error
                  ? "DISCONNECTED"
                  : "SYSTEM ONLINE"}
            </p>

            <p className="mt-1 text-[10px] tracking-wider text-slate-500">
              {status.lastUpdated
                ? `LAST UPDATE: ${new Date(status.lastUpdated).toLocaleTimeString("id-ID")}`
                : "WAITING FOR DATA"}
            </p>
          </div>
        </div>
      </header>

      {/* CONNECTION ERROR */}
      {status.error && (
        <div className="border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">
          <p className="font-bold">CONNECTION ERROR</p>
          <p className="mt-1">{String(status.error)}</p>
        </div>
      )}

      {/* ELECTRICAL MEASUREMENTS */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-wide">
              Electrical Measurements
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Live electrical parameters
            </p>
          </div>

          <span className="border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-400">
            {measurements.length} PARAMETERS
          </span>
        </div>

        {measurements.length === 0 ? (
          <div className="border border-slate-800 bg-[#101b2d] p-12 text-center text-sm text-slate-500">
            No measurement data available
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {measurements.map((item) => {
              const config = measurementConfig[item.Name] ?? {
                label: item.Name,
                unit: "",
                icon: "◈",
                description: "Electrical parameter",
              };

              return (
                <div
                  key={item.Name}
                  className="group relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-5 transition duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.08)]"
                >
                  <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-500/5 blur-2xl" />

                  <div className="relative flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-300">
                        {config.label}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {config.description}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 items-center justify-center border border-cyan-500/20 bg-cyan-500/10 text-xl font-bold text-cyan-400">
                      {config.icon}
                    </div>
                  </div>

                  <div className="relative mt-7 flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight text-white">
                      {formatValue(item.Instantaneous)}
                    </span>
                    <span className="text-sm font-semibold text-cyan-400">
                      {config.unit}
                    </span>
                  </div>

                  <div className="relative mt-5 h-1 overflow-hidden bg-slate-800">
                    <div className="h-full w-2/3 bg-gradient-to-r from-blue-500 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.6)]" />
                  </div>

                  <p className="relative mt-2 text-[10px] uppercase tracking-widest text-slate-600">
                    Instantaneous value
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* DEVICE STEPS */}
      <section>
        <StepsPanel
          data={data.steps}
          onMouseEnter={startStepsPolling}
          onMouseLeave={stopStepsPolling}
        />
      </section>

      {/* DEVICE ALARMS */}
      <section>
        <AlarmPanel
          data={data.alarms}
          onMouseEnter={startAlarmsPolling}
          onMouseLeave={stopAlarmsPolling}
        />
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 pt-5 text-center text-[10px] tracking-[0.2em] text-slate-600">
        CIRCUTOR INDUSTRIAL MONITORING SYSTEM · POWER MANAGEMENT
      </footer>

    </main>
  );
}
