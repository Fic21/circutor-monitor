
"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useConnection } from "@/components/providers/ConnectionProvider";

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

type DashboardStatus = Record<DataKey, ItemStatus> & {
  // Kompatibilitas dengan Dashboard yang sudah ada.
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
};

const endpoints: Record<DataKey, string> = {
  measurements: "/api/circutor/device-measures",
  steps: "/api/circutor/device-steps",
  alarms: "/api/circutor/device-alarms",
};

const initialItemStatus: ItemStatus = {
  loading: false,
  error: null,
  lastUpdated: null,
};

const initialData: DashboardData = {
  measurements: null,
  steps: null,
  alarms: null,
};

const initialStatus = (): Record<DataKey, ItemStatus> => ({
  measurements: { ...initialItemStatus },
  steps: { ...initialItemStatus },
  alarms: { ...initialItemStatus },
});

export function useDashboardData() {
  const { isConnected } = useConnection();

  const [data, setData] = useState<DashboardData>({
    ...initialData,
  });

  const [itemStatus, setItemStatus] = useState(initialStatus);

  const connectedRef = useRef(isConnected);
  const activeRef = useRef(false);
  const generationRef = useRef(0);

  const stepsActive = useRef(false);
  const alarmsActive = useRef(false);

  const measurementTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const stepsTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const alarmsTimer = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const controllers = useRef<
    Partial<Record<DataKey, AbortController>>
  >({});

  // ==========================================
  // FETCH DATA
  // ==========================================

  const fetchData = useCallback(async (key: DataKey) => {
    if (
      !connectedRef.current ||
      !activeRef.current ||
      document.hidden
    ) {
      return;
    }

    // Hindari request ganda untuk endpoint yang sama.
    if (controllers.current[key]) {
      return;
    }

    const generation = generationRef.current;
    const controller = new AbortController();

    controllers.current[key] = controller;

    const timeout = setTimeout(() => {
      controller.abort();
    }, 5000);

    setItemStatus((previous) => ({
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

      // Abaikan hasil request dari sesi sebelumnya.
      if (
        generation !== generationRef.current ||
        !connectedRef.current
      ) {
        return;
      }

      setData((previous) => ({
        ...previous,
        [key]: result,
      }));

      setItemStatus((previous) => ({
        ...previous,
        [key]: {
          loading: false,
          error: null,
          lastUpdated: new Date().toLocaleTimeString("id-ID"),
        },
      }));
    } catch (error) {
      if (
        generation !== generationRef.current ||
        !connectedRef.current
      ) {
        return;
      }

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        setItemStatus((previous) => ({
          ...previous,
          [key]: {
            ...previous[key],
            loading: false,
            error: "Request timeout",
          },
        }));

        return;
      }

      setItemStatus((previous) => ({
        ...previous,
        [key]: {
          ...previous[key],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Gagal mengambil data",
        },
      }));
    } finally {
      clearTimeout(timeout);

      if (controllers.current[key] === controller) {
        delete controllers.current[key];
      }

      if (
        generation === generationRef.current &&
        connectedRef.current
      ) {
        setItemStatus((previous) => ({
          ...previous,
          [key]: {
            ...previous[key],
            loading: false,
          },
        }));
      }
    }
  }, []);

  // ==========================================
  // STOP POLLING
  // ==========================================

  const stopStepsPolling = useCallback(() => {
    stepsActive.current = false;

    if (stepsTimer.current) {
      clearInterval(stepsTimer.current);
      stepsTimer.current = null;
    }
  }, []);

  const stopAlarmsPolling = useCallback(() => {
    alarmsActive.current = false;

    if (alarmsTimer.current) {
      clearInterval(alarmsTimer.current);
      alarmsTimer.current = null;
    }
  }, []);

  // ==========================================
  // START STEPS POLLING
  // ==========================================

  const startStepsPolling = useCallback(() => {
    if (!connectedRef.current || stepsActive.current) {
      return;
    }

    stepsActive.current = true;

    fetchData("steps");

    stepsTimer.current = setInterval(() => {
      fetchData("steps");
    }, 5000);
  }, [fetchData]);

  // ==========================================
  // START ALARMS POLLING
  // ==========================================

  const startAlarmsPolling = useCallback(() => {
    if (!connectedRef.current || alarmsActive.current) {
      return;
    }

    alarmsActive.current = true;

    fetchData("alarms");

    alarmsTimer.current = setInterval(() => {
      fetchData("alarms");
    }, 5000);
  }, [fetchData]);

  // ==========================================
  // GLOBAL CONNECTION CONTROL
  // ==========================================

  useEffect(() => {
    connectedRef.current = isConnected;

    if (!isConnected) {
      activeRef.current = false;
      generationRef.current += 1;

      // Hentikan semua timer.
      if (measurementTimer.current) {
        clearInterval(measurementTimer.current);
        measurementTimer.current = null;
      }

      stopStepsPolling();
      stopAlarmsPolling();

      // Batalkan request yang masih berjalan.
      Object.values(controllers.current).forEach((controller) => {
        controller?.abort();
      });

      controllers.current = {};

      // Bersihkan data sesi sebelumnya.
      setData({ ...initialData });
      setItemStatus(initialStatus());

      return;
    }

    // ========================================
    // CONNECTED
    // ========================================

    activeRef.current = true;

    // Ambil Measurements langsung setelah Connect.
    fetchData("measurements");

    // Measurements setiap 5 detik.
    measurementTimer.current = setInterval(() => {
      fetchData("measurements");
    }, 5000);

    // Saat tab kembali aktif, ambil data terbaru.
    const handleVisibility = () => {
      if (document.hidden || !connectedRef.current) {
        return;
      }

      fetchData("measurements");

      if (stepsActive.current) {
        fetchData("steps");
      }

      if (alarmsActive.current) {
        fetchData("alarms");
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      activeRef.current = false;

      if (measurementTimer.current) {
        clearInterval(measurementTimer.current);
        measurementTimer.current = null;
      }

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [
    isConnected,
    fetchData,
    stopStepsPolling,
    stopAlarmsPolling,
  ]);

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      activeRef.current = false;
      generationRef.current += 1;

      if (measurementTimer.current) {
        clearInterval(measurementTimer.current);
      }

      stopStepsPolling();
      stopAlarmsPolling();

      Object.values(controllers.current).forEach((controller) => {
        controller?.abort();
      });

      controllers.current = {};
    };
  }, [stopStepsPolling, stopAlarmsPolling]);

  // ==========================================
  // STATUS COMPATIBILITY
  // ==========================================

  const status: DashboardStatus = {
    ...itemStatus,

    // Alias untuk Dashboard versi sebelumnya.
    loading: itemStatus.measurements.loading,
    error: itemStatus.measurements.error,
    lastUpdated: itemStatus.measurements.lastUpdated,
  };

  return {
    data,
    status,
    startStepsPolling,
    stopStepsPolling,
    startAlarmsPolling,
    stopAlarmsPolling,
  };
}
