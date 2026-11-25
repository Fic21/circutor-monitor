
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Cpu,
  Fingerprint,
  CalendarDays,
  HardDrive,
  CircuitBoard,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock3,
  ShieldCheck,
  Wifi,
} from "lucide-react";

import { useConnection } from "@/components/providers/ConnectionProvider";

type DeviceInfo = {
  SerialNumber: string;
  SerialId: number;
  Date: string;
  Model: string;
  Firmware: {
    ESP32: string;
    Computer: string;
  };
};

export default function FirmwarePage() {
  const { isConnected } = useConnection();

  const [data, setData] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // ==========================================
  // CLEAR DEVICE INFORMATION
  // ==========================================

  const clearDeviceInfo = useCallback(() => {
    setData(null);
    setError(null);
    setLastUpdated(null);
    setLoading(false);
  }, []);

  // ==========================================
  // FETCH DEVICE INFORMATION
  // ==========================================

  const fetchDeviceInfo = useCallback(async () => {
    if (!isConnected) return;

    // Batalkan request sebelumnya jika masih berjalan.
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    const timeout = setTimeout(() => {
      controller.abort();
    }, 7000);

    try {
      const response = await fetch(
        "/api/circutor/device-info",
        {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const result = await response.json();

      if (
        !result ||
        typeof result.SerialNumber !== "string" ||
        typeof result.SerialId !== "number" ||
        typeof result.Date !== "string" ||
        typeof result.Model !== "string" ||
        typeof result.Firmware?.ESP32 !== "string" ||
        typeof result.Firmware?.Computer !== "string"
      ) {
        throw new Error("Format device-info tidak sesuai");
      }

      // Abaikan hasil request lama.
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil informasi perangkat"
      );
    } finally {
      clearTimeout(timeout);

      if (requestId === requestIdRef.current) {
        controllerRef.current = null;
        setLoading(false);
      }
    }
  }, [isConnected]);

  // ==========================================
  // GLOBAL CONNECTION LIFECYCLE
  // ==========================================

  useEffect(() => {
    if (!isConnected) {
      requestIdRef.current += 1;

      controllerRef.current?.abort();
      controllerRef.current = null;

      clearDeviceInfo();

      return;
    }

    // Ambil informasi perangkat setelah Connect.
    fetchDeviceInfo();

    return () => {
      requestIdRef.current += 1;

      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [isConnected, fetchDeviceInfo, clearDeviceInfo]);

  // ==========================================
  // CONNECTION DISPLAY STATUS
  // ==========================================

  const connectionLabel = !isConnected
    ? "DISCONNECTED"
    : loading
      ? "RETRIEVING DATA"
      : error
        ? "DATA ERROR"
        : data
          ? "CONNECTED"
          : "WAITING FOR DATA";

  const connectionColor = !isConnected
    ? "bg-slate-500"
    : loading
      ? "bg-amber-400 animate-pulse"
      : error
        ? "bg-red-500"
        : data
          ? "bg-emerald-400 shadow-[0_0_12px_#34d399]"
          : "bg-amber-400";

  return (
    <main className="min-h-screen space-y-7 bg-[#080f1c] p-4 text-white sm:p-6 lg:p-8">

      {/* HEADER */}
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] text-cyan-400">
            <Cpu size={16} />
            CIRCUTOR / DEVICE MANAGEMENT
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Firmware <span className="text-cyan-400">Information</span>
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Hardware identification and firmware diagnostics
          </p>
        </div>

        <button
          onClick={fetchDeviceInfo}
          disabled={!isConnected || loading}
          className="flex items-center justify-center gap-2 border border-cyan-500/30 bg-cyan-500/10 px-5 py-3 text-xs font-bold tracking-widest text-cyan-400 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
          REFRESH DATA
        </button>
      </header>

      {/* CONNECTION STATUS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="border border-slate-700/70 bg-[#101b2d] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              DEVICE CONNECTION
            </p>
            <Wifi size={19} className="text-cyan-400" />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${connectionColor}`} />

            <span className="text-lg font-bold">
              {connectionLabel}
            </span>
          </div>
        </div>

        <div className="border border-slate-700/70 bg-[#101b2d] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              DEVICE MODEL
            </p>
            <HardDrive size={19} className="text-cyan-400" />
          </div>

          <p className="mt-4 text-lg font-bold text-white">
            {data?.Model ?? (loading ? "Loading..." : "-")}
          </p>
        </div>

        <div className="border border-slate-700/70 bg-[#101b2d] p-5 shadow-xl">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold tracking-widest text-slate-500">
              FIRMWARE COMPONENTS
            </p>
            <CircuitBoard size={19} className="text-cyan-400" />
          </div>

          <p className="mt-4 text-3xl font-bold text-white">
            {data ? Object.keys(data.Firmware).length : "-"}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Firmware modules detected
          </p>
        </div>

      </section>

      {/* CONNECTION MESSAGE */}
      {!isConnected && (
        <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertCircle className="shrink-0 text-amber-400" size={20} />
          <div>
            <p className="text-sm font-bold text-amber-400">
              CIRCUTOR NOT CONNECTED
            </p>
            <p className="mt-1 text-xs text-amber-300/80">
              Tekan Connect pada Header untuk mengambil informasi perangkat.
            </p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 border border-red-500/30 bg-red-500/10 p-4">
          <AlertCircle className="shrink-0 text-red-400" size={20} />
          <div>
            <p className="text-sm font-bold text-red-400">
              DEVICE INFORMATION ERROR
            </p>
            <p className="mt-1 text-xs text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* DEVICE IDENTITY */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-wide">
            Device Identity
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Hardware identification and manufacturing information
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          {/* SERIAL NUMBER */}
          <div className="relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-6 shadow-xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  SERIAL NUMBER
                </p>

                <p className="mt-4 break-all text-2xl font-bold tracking-wider text-white sm:text-3xl">
                  {data?.SerialNumber ?? (loading ? "Loading..." : "-")}
                </p>
              </div>

              <Fingerprint
                size={35}
                className="shrink-0 text-cyan-400"
              />
            </div>
          </div>

          {/* SERIAL ID */}
          <div className="relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-6 shadow-xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  SERIAL ID
                </p>

                <p className="mt-4 text-3xl font-bold text-white">
                  {data?.SerialId ?? (loading ? "Loading..." : "-")}
                </p>
              </div>

              <Cpu size={35} className="shrink-0 text-blue-400" />
            </div>
          </div>

          {/* MODEL */}
          <div className="relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  DEVICE MODEL
                </p>

                <p className="mt-4 text-2xl font-bold text-white">
                  {data?.Model ?? (loading ? "Loading..." : "-")}
                </p>
              </div>

              <HardDrive size={35} className="text-cyan-400" />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Circutor hardware platform
            </p>
          </div>

          {/* MANUFACTURING DATE */}
          <div className="relative overflow-hidden border border-slate-700/70 bg-[#101b2d] p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500">
                  MANUFACTURING DATE
                </p>

                <p className="mt-4 text-xl font-bold text-white">
                  {data?.Date ?? (loading ? "Loading..." : "-")}
                </p>
              </div>

              <CalendarDays size={35} className="text-cyan-400" />
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Production year and week
            </p>
          </div>

        </div>
      </section>

      {/* FIRMWARE VERSIONS */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-wide">
            Firmware Versions
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Installed software versions across device components
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

          {/* ESP32 */}
          <div className="relative overflow-hidden border border-cyan-500/30 bg-[#101b2d] p-6 shadow-xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-cyan-400">
                  MICROCONTROLLER FIRMWARE
                </p>

                <h3 className="mt-3 text-xl font-bold text-white">
                  ESP32
                </h3>
              </div>

              <div className="flex h-14 w-14 items-center justify-center border border-cyan-500/30 bg-cyan-500/10">
                <Cpu size={28} className="text-cyan-400" />
              </div>
            </div>

            <div className="relative mt-7 border-t border-slate-700/70 pt-5">
              <p className="text-[10px] tracking-widest text-slate-500">
                INSTALLED VERSION
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-cyan-400">
                  {data?.Firmware.ESP32 ?? (loading ? "..." : "-")}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Firmware information retrieved
              </div>
            </div>
          </div>

          {/* COMPUTER */}
          <div className="relative overflow-hidden border border-blue-500/30 bg-[#101b2d] p-6 shadow-xl">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[0.25em] text-blue-400">
                  MAIN SYSTEM FIRMWARE
                </p>

                <h3 className="mt-3 text-xl font-bold text-white">
                  Computer
                </h3>
              </div>

              <div className="flex h-14 w-14 items-center justify-center border border-blue-500/30 bg-blue-500/10">
                <CircuitBoard size={28} className="text-blue-400" />
              </div>
            </div>

            <div className="relative mt-7 border-t border-slate-700/70 pt-5">
              <p className="text-[10px] tracking-widest text-slate-500">
                INSTALLED VERSION
              </p>

              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-5xl font-bold tracking-tight text-blue-400">
                  {data?.Firmware.Computer ?? (loading ? "..." : "-")}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-slate-400">
                <CheckCircle2 size={15} className="text-emerald-400" />
                Firmware information retrieved
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SYSTEM INFORMATION */}
      <section className="border border-slate-700/70 bg-[#101b2d] p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={21} className="text-cyan-400" />
            <div>
              <h2 className="text-sm font-bold text-white">
                System Information
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Device information retrieval status
              </p>
            </div>
          </div>

          <span
            className={`flex items-center gap-2 text-xs ${
              data
                ? "text-emerald-400"
                : "text-slate-500"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                data ? "bg-emerald-400" : "bg-slate-500"
              }`}
            />
            {data ? "DATA SYNCHRONIZED" : "WAITING FOR DATA"}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-slate-700/70 pt-4">
          <Clock3 size={16} className="text-cyan-400" />
          <div>
            <p className="text-[10px] tracking-widest text-slate-500">
              LAST SUCCESSFUL UPDATE
            </p>
            <p className="mt-1 text-xs text-slate-300">
              {lastUpdated
                ? lastUpdated.toLocaleString("id-ID")
                : "No update available"}
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 pt-5 text-center text-[10px] tracking-[0.2em] text-slate-600">
        CIRCUTOR INDUSTRIAL MONITORING SYSTEM · FIRMWARE MANAGEMENT
      </footer>

    </main>
  );
}
