
"use client";

import { useState } from "react";
import {
  Zap,
  Wifi,
  WifiOff,
  LoaderCircle,
} from "lucide-react";

import { useConnection } from "@/components/providers/ConnectionProvider";

export default function Header() {
  const {
    status,
    isConnected,
    connect,
    disconnect,
  } = useConnection();

  const [error, setError] = useState<string | null>(null);

  const isBusy =
    status === "checking" ||
    status === "connecting" ||
    status === "disconnecting";

  async function handleConnection() {
    setError(null);

    try {
      if (isConnected) {
        await disconnect();
      } else {
        await connect();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan koneksi"
      );
    }
  }

  const statusLabel = {
    checking: "CHECKING",
    connecting: "CONNECTING",
    connected: "CONNECTED",
    disconnecting: "DISCONNECTING",
    disconnected: "DISCONNECTED",
  }[status];

  return (
    <header className="flex min-h-[76px] items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 text-white shadow-lg shadow-black/20">
      {/* Identitas aplikasi */}
      <div className="flex items-center gap-3">
        <div className="flex items-center">
</div>
      </div>

      {/* Identitas pembuat dan koneksi */}
      <div className="flex items-center gap-6">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-medium tracking-wider text-slate-300">
            CREATED BY
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-400">
            Fikra
          </p>
        </div>

        <div className="h-9 w-px bg-slate-700" />

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            {isBusy ? (
              <LoaderCircle
                size={15}
                className="animate-spin text-amber-400"
              />
            ) : isConnected ? (
              <Wifi size={15} className="text-emerald-400" />
            ) : (
              <WifiOff size={15} className="text-slate-400" />
            )}

            <span
              className={`text-[10px] font-semibold tracking-widest ${
                isConnected
                  ? "text-emerald-400"
                  : status === "connecting" ||
                      status === "disconnecting"
                    ? "text-amber-400"
                    : "text-slate-400"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleConnection}
            disabled={isBusy}
            className={`flex min-w-[112px] items-center justify-center gap-2 px-4 py-2 text-xs font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${
              isConnected
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isBusy
              ? status === "checking"
                ? "PLEASE WAIT"
                : status === "connecting"
                  ? "CONNECTING"
                  : "DISCONNECTING"
              : isConnected
                ? "DISCONNECT"
                : "CONNECT"}
          </button>

          {error && (
            <p className="max-w-[220px] text-right text-[10px] text-red-400">
              {error}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
