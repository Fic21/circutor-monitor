
"use client";

import { useEffect, useState } from "react";

type ResourceResult = {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
};

function useDeviceResource(endpoint: string) {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(`/api/circutor/${endpoint}`, {
          cache: "no-store",
        });

        const result: ResourceResult = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.error || "Failed to load device data");
        }

        if (active) {
          setData(result.data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load data"
          );
        }
      }
    }

    load();
    const interval = setInterval(load, 10000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [endpoint]);

  return { data, error };
}

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 break-all text-lg font-semibold">
        {value === undefined || value === null || value === ""
          ? "-"
          : String(value)}
      </p>
    </div>
  );
}

function StatusBadge({ value }: { value: unknown }) {
  const connected = value === true;

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        connected
          ? "bg-green-500/15 text-green-600"
          : "bg-gray-500/15 text-gray-500"
      }`}
    >
      {connected ? "Connected / Enabled" : "Disconnected / Disabled"}
    </span>
  );
}

export function FirmwarePage() {
  const { data, error } = useDeviceResource("device-info");

  const firmware =
    data?.Firmware && typeof data.Firmware === "object"
      ? (data.Firmware as Record<string, unknown>)
      : {};

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Firmware</h1>
        <p className="text-sm text-muted-foreground">
          Device identification and firmware information
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Device Information</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="Serial Number" value={data?.SerialNumber} />
          <InfoCard title="Serial ID" value={data?.SerialId} />
          <InfoCard title="Model" value={data?.Model} />
          <InfoCard title="Manufacture Date" value={data?.Date} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Firmware Version</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard title="ESP32 Firmware" value={firmware.ESP32} />
          <InfoCard title="Computer Firmware" value={firmware.Computer} />
        </div>
      </section>
    </main>
  );
}

export function CommunicationPage() {
  const wifi = useDeviceResource("wifi");
  const bluetooth = useDeviceResource("bluetooth");
  const thingsboard = useDeviceResource("thingsboard");

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Communication</h1>
        <p className="text-sm text-muted-foreground">
          Network and communication interfaces
        </p>
      </div>

      {wifi.error && <p className="text-sm text-red-500">WiFi: {wifi.error}</p>}
      {bluetooth.error && (
        <p className="text-sm text-red-500">Bluetooth: {bluetooth.error}</p>
      )}
      {thingsboard.error && (
        <p className="text-sm text-red-500">
          ThingsBoard: {thingsboard.error}
        </p>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">WiFi</h2>
          <StatusBadge value={wifi.data?.Connected} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCard title="SSID" value={wifi.data?.SSID} />
          <InfoCard title="IP Address" value={wifi.data?.IP} />
          <InfoCard title="Subnet Mask" value={wifi.data?.Mask} />
          <InfoCard title="Gateway" value={wifi.data?.Gateway} />
          <InfoCard title="MAC Address" value={wifi.data?.MAC} />
          <InfoCard title="Signal Strength" value={
            wifi.data?.Strength === undefined
              ? "-"
              : `${wifi.data.Strength}%`
          } />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bluetooth</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard title="Device Name" value={bluetooth.data?.Name} />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">ThingsBoard</h2>
          <StatusBadge value={thingsboard.data?.Connected} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard title="Enabled" value={
            thingsboard.data?.Enabled === undefined
              ? "-"
              : thingsboard.data.Enabled ? "Yes" : "No"
          } />
          <InfoCard title="Broker URI" value={thingsboard.data?.BrokerUri} />
          <InfoCard title="Telemetry Topic" value={thingsboard.data?.Topic} />
        </div>
      </section>
    </main>
  );
}
