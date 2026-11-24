
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type DataKey = "measurements" | "steps" | "alarms";

type DashboardData = {
  measurements: unknown;
  steps: unknown;
  alarms: unknown;
};

type ItemStatus = {
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
};

type DashboardStatus = Record<DataKey, ItemStatus>;

const endpoints: Record<DataKey, string> = {
  measurements: "/api/circutor/device-measures",
  steps: "/api/circutor/device-steps",
  alarms: "/api/circutor/device-alarms",
};

const initialStatus: ItemStatus = {
  loading: false,
  error: null,
  lastUpdated: null,
};

export function useDashboardData() {
  const [data, setData] = useState<DashboardData>({
    measurements: null,
    steps: null,
    alarms: null,
  });

  const [status, setStatus] = useState<DashboardStatus>({
    measurements: { ...initialStatus },
    steps: { ...initialStatus },
    alarms: { ...initialStatus },
  });

  const busyRef = useRef(false);
  const activeRef = useRef(false);
  const mountedRef = useRef(false);

  const stepsActive = useRef(false);
  const alarmsActive = useRef(false);

  const stepsTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const alarmsTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async (key: DataKey) => {
    if (
      !activeRef.current ||
      document.hidden ||
      busyRef.current
    ) {
      return;
    }

    busyRef.current = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    setStatus((previous) => ({
      ...previous,
      [key]: {
        ...previous[key],
        loading: true,
        error: null,
      },
    }));

    try {
      const response = await fetch(endpoints[key], {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (!activeRef.current) return;

      setData((previous) => ({
        ...previous,
        [key]: result,
      }));

      setStatus((previous) => ({
        ...previous,
        [key]: {
          loading: false,
          error: null,
          lastUpdated: new Date().toLocaleTimeString("id-ID"),
        },
      }));
    } catch (error) {
      if (!activeRef.current) return;

      setStatus((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          loading: false,
          error:
            error instanceof Error
              ? error.name === "AbortError"
                ? "Request timeout"
                : error.message
              : "Gagal mengambil data",
        },
      }));
    } finally {
      clearTimeout(timeout);
      busyRef.current = false;

      if (activeRef.current) {
        setStatus((previous) => ({
          ...previous,
          [key]: {
            ...previous[key],
            loading: false,
          },
        }));
      }
    }
  }, []);

  // Measurements: setiap 5 detik
  useEffect(() => {
    activeRef.current = true;
    mountedRef.current = true;

    fetchData("measurements");

    const timer = setInterval(() => {
      fetchData("measurements");
    }, 5000);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchData("measurements");

        if (stepsActive.current) fetchData("steps");
        if (alarmsActive.current) fetchData("alarms");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      activeRef.current = false;
      mountedRef.current = false;

      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);

      if (stepsTimer.current) clearInterval(stepsTimer.current);
      if (alarmsTimer.current) clearInterval(alarmsTimer.current);
    };
  }, [fetchData]);

  // Steps: aktif saat mouse masuk
  const startStepsPolling = useCallback(() => {
    if (stepsActive.current) return;

    stepsActive.current = true;
    fetchData("steps");

    stepsTimer.current = setInterval(() => {
      fetchData("steps");
    }, 5000);
  }, [fetchData]);

  const stopStepsPolling = useCallback(() => {
    stepsActive.current = false;

    if (stepsTimer.current) {
      clearInterval(stepsTimer.current);
      stepsTimer.current = null;
    }
  }, []);

  // Alarms: aktif saat mouse masuk
  const startAlarmsPolling = useCallback(() => {
    if (alarmsActive.current) return;

    alarmsActive.current = true;
    fetchData("alarms");

    alarmsTimer.current = setInterval(() => {
      fetchData("alarms");
    }, 5000);
  }, [fetchData]);

  const stopAlarmsPolling = useCallback(() => {
    alarmsActive.current = false;

    if (alarmsTimer.current) {
      clearInterval(alarmsTimer.current);
      alarmsTimer.current = null;
    }
  }, []);

  return {
    data,
    status,
    startStepsPolling,
    stopStepsPolling,
    startAlarmsPolling,
    stopAlarmsPolling,
  };
}
