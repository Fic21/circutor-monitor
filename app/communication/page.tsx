
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wifi,
  Bluetooth,
  Cloud,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Network,
  RadioTower,
} from "lucide-react";

import { useConnection } from "@/components/providers/ConnectionProvider";

type WifiData = {
  Enabled?: boolean | string;
  Connected?: boolean | string;
  SSID?: string;
  Password?: string;
  IP?: string;
  Mask?: string;
  Gateway?: string;
  MAC?: string;
  Strength?: number | string;
};

type BluetoothData = {
  Name?: string;
};

type ThingsBoardData = {
  Enabled?: boolean | string;
  Connected?: boolean | string;
  BrokerUri?: string;
  Token?: string;
  Topic?: string;
};

type ResourceState<T> = {
  data: T | null;
  error: string | null;
};

function isEnabled(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    String(value).toLowerCase() === "true" ||
    String(value).toLowerCase() === "on"
  );
}

function Status({ value }: { value: unknown }) {
  const active = isEnabled(value);

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-slate-500/10 text-slate-400"
      }`}
    >
      {active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
      {active ? "CONNECTED / ENABLED" : "DISCONNECTED / DISABLED"}
    </span>
  );
}

function InfoRow({
  label,
  value,
  secret = false,
}: {
  label: string;
  value?: string | number;
  secret?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  const displayValue =
    value === undefined || value === null || value === ""
      ? "-"
      : String(value);

  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-800 py-3 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>

      <div className="flex min-w-0 items-center gap-2">
        <span className="break-all text-right text-sm font-medium text-slate-200">
          {secret && displayValue !== "-"
            ? visible
              ? displayValue
              : "••••••••••••"
            : displayValue}
        </span>

        {secret && displayValue !== "-" && (
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="shrink-0 text-slate-500 transition hover:text-white"
            aria-label={visible ? "Hide value" : "Show value"}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="bg-blue-500/10 p-3 text-blue-400">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="font-semibold text-white">{title}</h2>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export default function CommunicationPage() {
  const { isConnected } = useConnection();

  const [wifi, setWifi] = useState<ResourceState<WifiData>>({
    data: null,
    error: null,
  });

  const [bluetooth, setBluetooth] =
    useState<ResourceState<BluetoothData>>({
      data: null,
      error: null,
    });

  const [thingsBoard, setThingsBoard] =
    useState<ResourceState<ThingsBoardData>>({
      data: null,
      error: null,
    });

  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // ==========================================
  // RESET DATA
  // ==========================================

  const clearCommunicationData = useCallback(() => {
    setWifi({ data: null, error: null });
    setBluetooth({ data: null, error: null });
    setThingsBoard({ data: null, error: null });
    setLastUpdated(null);
    setLoading(false);
  }, []);

  // ==========================================
  // FETCH RESOURCE
  // ==========================================

  const fetchResource = async <T,>(
    url: string,
    signal: AbortSignal
  ): Promise<ResourceState<T>> => {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      // Baca response sebagai text agar pesan error backend tidak hilang.
      const responseText = await response.text();

      let responseData: unknown;

      try {
        responseData = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        responseData = responseText;
      }

      if (!response.ok) {
        const errorMessage =
          typeof responseData === "object" && responseData !== null
            ? JSON.stringify(responseData)
            : String(responseData || `HTTP ${response.status}`);

        throw new Error(
          `HTTP ${response.status}: ${errorMessage}`
        );
      }

      return {
        data: responseData as T,
        error: null,
      };
    } catch (error) {
      if (signal.aborted) {
        throw error;
      }

      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data",
      };
    }
  };

  // ==========================================
  // LOAD COMMUNICATION DATA
  // ==========================================

  const loadCommunicationData = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    // Batalkan refresh sebelumnya jika masih berjalan.
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    const requestId = ++requestIdRef.current;

    setLoading(true);

    try {
      const [wifiResult, bluetoothResult, thingsBoardResult] =
        await Promise.all([
          fetchResource<WifiData>(
            "/api/circutor/wifi",
            controller.signal
          ),
          fetchResource<BluetoothData>(
            "/api/circutor/bluetooth",
            controller.signal
          ),
          fetchResource<ThingsBoardData>(
            "/api/circutor/thingsboard",
            controller.signal
          ),
        ]);

      // Abaikan hasil request lama atau sesi yang sudah diputus.
      if (
        controller.signal.aborted ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      setWifi(wifiResult);
      setBluetooth(bluetoothResult);
      setThingsBoard(thingsBoardResult);

      setLastUpdated(new Date().toLocaleTimeString("id-ID"));
    } catch (error) {
      if (!controller.signal.aborted) {
        console.error("Communication request:", error);
      }
    } finally {
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

      clearCommunicationData();

      return;
    }

    // Ambil data hanya setelah koneksi aktif.
    loadCommunicationData();

    return () => {
      requestIdRef.current += 1;

      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, [
    isConnected,
    loadCommunicationData,
    clearCommunicationData,
  ]);

  const wifiData = wifi.data;
  const bluetoothData = bluetooth.data;
  const thingsBoardData = thingsBoard.data;

  return (
    <main className="min-h-screen bg-[#080f1c] p-5 text-white md:p-8">
      {/* HEADER */}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-blue-400">
            <RadioTower size={15} />
            Device Configuration
          </div>

          <h1 className="text-2xl font-bold tracking-wide">
            Communication
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Network and communication interface monitoring
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">Last Updated</p>
            <p className="text-sm text-slate-300">
              {lastUpdated ?? "-"}
            </p>
          </div>

          <button
            onClick={loadCommunicationData}
            disabled={!isConnected || loading}
            className="flex items-center gap-2 bg-blue-600 px-4 py-2.5 text-sm font-medium transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* CONNECTION MESSAGE */}

      {!isConnected && (
        <div className="mb-6 flex items-center gap-3 border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400">
          <AlertCircle size={18} />
          CIRCUTOR belum terhubung. Tekan Connect pada Header untuk mengambil data.
        </div>
      )}

      {/* COMMUNICATION CARDS */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* WIFI */}

        <section className="border border-slate-800 bg-[#0d1728] p-6 shadow-lg shadow-black/20">
          <SectionHeader
            icon={Wifi}
            title="Wi-Fi Configuration"
            description="Wireless network interface"
          />

          {wifi.error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              <span className="break-all">{wifi.error}</span>
            </div>
          )}

          {wifiData ? (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <Status value={wifiData.Enabled} />
                <Status value={wifiData.Connected} />
              </div>

              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-blue-400">
                Network Information
              </div>

              <InfoRow label="SSID" value={wifiData.SSID} />
              <InfoRow
                label="Password"
                value={wifiData.Password}
                secret
              />
              <InfoRow label="IP Address" value={wifiData.IP} />
              <InfoRow label="Subnet Mask" value={wifiData.Mask} />
              <InfoRow label="Gateway" value={wifiData.Gateway} />
              <InfoRow label="MAC Address" value={wifiData.MAC} />
              <InfoRow
                label="Signal Strength"
                value={wifiData.Strength}
              />
            </>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              {!isConnected
                ? "Connect to CIRCUTOR to view Wi-Fi data"
                : loading
                  ? "Loading Wi-Fi data..."
                  : "Wi-Fi data unavailable"}
            </p>
          )}
        </section>

        {/* BLUETOOTH */}

        <section className="border border-slate-800 bg-[#0d1728] p-6 shadow-lg shadow-black/20">
          <SectionHeader
            icon={Bluetooth}
            title="Bluetooth Configuration"
            description="Bluetooth device interface"
          />

          {bluetooth.error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              <span className="break-all">{bluetooth.error}</span>
            </div>
          )}

          {bluetoothData ? (
            <>
              <div className="mb-5 flex items-center gap-3">
                <div className="bg-blue-500/10 p-4 text-blue-400">
                  <Bluetooth size={30} />
                </div>

                <div>
                  <p className="text-xs text-slate-500">
                    Bluetooth Device Name
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {bluetoothData.Name || "-"}
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <InfoRow
                  label="Device Name"
                  value={bluetoothData.Name}
                />
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              {!isConnected
                ? "Connect to CIRCUTOR to view Bluetooth data"
                : loading
                  ? "Loading Bluetooth data..."
                  : "Bluetooth data unavailable"}
            </p>
          )}
        </section>

        {/* THINGSBOARD */}

        <section className="border border-slate-800 bg-[#0d1728] p-6 shadow-lg shadow-black/20 xl:col-span-2">
          <SectionHeader
            icon={Cloud}
            title="ThingsBoard Configuration"
            description="IoT cloud platform communication"
          />

          {thingsBoard.error && (
            <div className="mb-4 flex items-center gap-2 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} />
              <span className="break-all">{thingsBoard.error}</span>
            </div>
          )}

          {thingsBoardData ? (
            <>
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <Status value={thingsBoardData.Enabled} />
                <Status value={thingsBoardData.Connected} />
              </div>

              <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <Network size={15} />
                    Server Information
                  </div>

                  <InfoRow
                    label="Broker URI"
                    value={thingsBoardData.BrokerUri}
                  />

                  <InfoRow
                    label="Topic"
                    value={thingsBoardData.Topic}
                  />
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                    <Cloud size={15} />
                    Authentication
                  </div>

                  <InfoRow
                    label="Access Token"
                    value={thingsBoardData.Token}
                    secret
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              {!isConnected
                ? "Connect to CIRCUTOR to view ThingsBoard data"
                : loading
                  ? "Loading ThingsBoard data..."
                  : "ThingsBoard data unavailable"}
            </p>
          )}
        </section>
      </div>

      <div className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-600">
        CIRCUTOR Energy Monitoring · Communication Interface
      </div>
    </main>
  );
}
