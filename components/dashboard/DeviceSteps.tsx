
"use client";

import { useEffect, useState } from "react";

interface Step {
  Step: number;
  Counter: number;
  Status: string;
}

interface Alarm {
  Alarm: string;
  Status: string;
}

interface StepsData {
  OperatingHours: number;
  Steps: Step[];
}

export default function DeviceStatus() {
  const [steps, setSteps] = useState<StepsData | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [stepsResponse, alarmsResponse] = await Promise.all([
          fetch("/api/circutor/device-steps", { cache: "no-store" }),
          fetch("/api/circutor/device-alarms", { cache: "no-store" }),
        ]);

        const stepsResult = await stepsResponse.json();
        const alarmsResult = await alarmsResponse.json();

        if (!stepsResponse.ok || !stepsResult.success) {
          throw new Error(stepsResult.error || "Failed to load steps");
        }

        if (!alarmsResponse.ok || !alarmsResult.success) {
          throw new Error(alarmsResult.error || "Failed to load alarms");
        }

        if (active) {
          setSteps(stepsResult.data);
          setAlarms(alarmsResult.data);
          setError("");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Unable to load device status"
          );
        }
      }
    }

    loadData();
    const interval = setInterval(loadData, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const activeSteps =
    steps?.Steps.filter((step) => step.Status === "ON").length ?? 0;

  const activeAlarms =
    alarms.filter((alarm) => alarm.Status === "ON").length;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Capacitor Steps</h2>
          <span className="text-sm text-muted-foreground">
            {activeSteps} / {steps?.Steps.length ?? 0} Active
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {steps?.Steps.map((step) => (
            <div
              key={step.Step}
              className="rounded-xl border p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Step {step.Step}
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    step.Status === "ON" ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
              </div>

              <div className="mt-3 text-2xl font-semibold">
                {step.Counter.toLocaleString()}
              </div>

              <div className="mt-1 text-xs text-muted-foreground">
                Switching Counter
              </div>

              <div className="mt-3 text-sm font-medium">
                {step.Status}
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Operating Hours: {steps?.OperatingHours.toLocaleString() ?? "-"} h
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Alarm Status</h2>
          <span
            className={`text-sm font-medium ${
              activeAlarms > 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {activeAlarms > 0
              ? `${activeAlarms} Active Alarm(s)`
              : "No Active Alarms"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {alarms.map((alarm) => (
            <div
              key={alarm.Alarm}
              className="flex items-center justify-between rounded-xl border p-4"
            >
              <span className="font-medium">{alarm.Alarm}</span>

              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  alarm.Status === "ON"
                    ? "bg-red-500/15 text-red-500"
                    : "bg-green-500/15 text-green-600"
                }`}
              >
                {alarm.Status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
