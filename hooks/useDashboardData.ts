
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

// ==========================================
// POLLING INTERVAL
// ==========================================

const getPollingInterval = (
  key: DataKey,
  isHovered: boolean
): number => {
  switch (key) {
    case "measurements":
      return 5000;

    case "steps":
      return isHovered ? 10000 : 60000;

    case "alarms":
      return isHovered ? 15000 : 60000;
  }
};

export function useDashboardData() {
  const { isConnected } = useConnection();

  const [data, setData] = useState<DashboardData>({
    ...initialData,
  });

  const [itemStatus, setItemStatus] = useState(initialStatus);

  // ==========================================
  // REFS
  // ==========================================

  const connectedRef = useRef(isConnected);
  const activeRef = useRef(false);
  const generationRef = useRef(0);

  const stepsActive = useRef(false);
  const alarmsActive = useRef(false);

  const timers = useRef<
    Record<DataKey, ReturnType<typeof setTimeout> | null>
  >({
    measurements: null,
    steps: null,
    alarms: null,
  });

  const controllers = useRef<
    Partial<Record<DataKey, AbortController>>
  >({});

  const schedulePollingRef = useRef<
    (key: DataKey, delay: number) => void
  >(() => {});

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

    // Satu request aktif untuk setiap resource.
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
  // CLEAR TIMER
  // ==========================================

  const clearPollingTimer = useCallback((key: DataKey) => {
    if (timers.current[key]) {
      clearTimeout(timers.current[key]!);
      timers.current[key] = null;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    (Object.keys(timers.current) as DataKey[]).forEach((key) => {
      clearTimeout(timers.current[key] ?? undefined);
      timers.current[key] = null;
    });
  }, []);

  // ==========================================
  // CENTRAL POLLING SCHEDULER
  // ==========================================

  const schedulePolling = useCallback(
    (key: DataKey, delay: number) => {
      clearPollingTimer(key);

      if (
        !connectedRef.current ||
        !activeRef.current ||
        document.hidden
      ) {
        return;
      }

      timers.current[key] = setTimeout(async () => {
        timers.current[key] = null;

        if (
          !connectedRef.current ||
          !activeRef.current ||
          document.hidden
        ) {
          return;
        }

        // Tunggu request resource ini selesai.
        await fetchData(key);

        if (
          !connectedRef.current ||
          !activeRef.current ||
          document.hidden
        ) {
          return;
        }

        // Hitung interval terbaru berdasarkan posisi pointer.
        const isHovered =
          key === "steps"
            ? stepsActive.current
            : key === "alarms"
              ? alarmsActive.current
              : false;

        const nextInterval = getPollingInterval(
          key,
          isHovered
        );

        // Jadwalkan polling berikutnya.
        schedulePollingRef.current(key, nextInterval);
      }, delay);
    },
    [clearPollingTimer, fetchData]
  );

  // Referensi scheduler agar dapat memanggil dirinya sendiri.
  schedulePollingRef.current = schedulePolling;

  // ==========================================
  // DEVICE STEPS
  // ==========================================

  // Dipanggil ketika pointer masuk panel Steps.
  const startStepsPolling = useCallback(() => {
    if (!connectedRef.current || !activeRef.current) {
      return;
    }

    stepsActive.current = true;

    // Update langsung ketika pointer masuk.
    schedulePollingRef.current("steps", 0);
  }, []);

  // Dipanggil ketika pointer keluar panel Steps.
  // Polling tidak dihentikan, hanya berubah menjadi 60 detik.
  const stopStepsPolling = useCallback(() => {
    stepsActive.current = false;

    if (!connectedRef.current || !activeRef.current) {
      return;
    }

    schedulePollingRef.current("steps", 60000);
  }, []);

  // ==========================================
  // DEVICE ALARMS
  // ==========================================

  // Dipanggil ketika pointer masuk panel Alarms.
  const startAlarmsPolling = useCallback(() => {
    if (!connectedRef.current || !activeRef.current) {
      return;
    }

    alarmsActive.current = true;

    // Update langsung ketika pointer masuk.
    schedulePollingRef.current("alarms", 0);
  }, []);

  // Dipanggil ketika pointer keluar panel Alarms.
  // Polling tetap aktif setiap 60 detik.
  const stopAlarmsPolling = useCallback(() => {
    alarmsActive.current = false;

    if (!connectedRef.current || !activeRef.current) {
      return;
    }

    schedulePollingRef.current("alarms", 60000);
  }, []);

  // ==========================================
  // GLOBAL CONNECTION CONTROL
  // ==========================================

  useEffect(() => {
    connectedRef.current = isConnected;

    if (!isConnected) {
      activeRef.current = false;
      generationRef.current += 1;

      clearAllTimers();

      stepsActive.current = false;
      alarmsActive.current = false;

      // Batalkan seluruh request aktif.
      Object.values(controllers.current).forEach(
        (controller) => {
          controller?.abort();
        }
      );

      controllers.current = {};

      setData({ ...initialData });
      setItemStatus(initialStatus());

      return;
    }

    // ========================================
    // CONNECTED
    // ========================================

    activeRef.current = true;

    // Reset status pointer saat koneksi baru.
    stepsActive.current = false;
    alarmsActive.current = false;

    // Ambil seluruh data langsung saat Connect.
    schedulePollingRef.current("measurements", 0);
    schedulePollingRef.current("steps", 0);
    schedulePollingRef.current("alarms", 0);

    // ========================================
    // VISIBILITY CHANGE
    // ========================================

    const handleVisibility = () => {
      if (document.hidden) {
        // Hentikan timer sementara tab tidak aktif.
        clearAllTimers();
        return;
      }

      if (!connectedRef.current || !activeRef.current) {
        return;
      }

      // Ambil seluruh data terbaru ketika tab aktif kembali.
      schedulePollingRef.current("measurements", 0);
      schedulePollingRef.current("steps", 0);
      schedulePollingRef.current("alarms", 0);
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      activeRef.current = false;

      clearAllTimers();

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, [isConnected, clearAllTimers]);

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      activeRef.current = false;
      generationRef.current += 1;

      clearAllTimers();

      stepsActive.current = false;
      alarmsActive.current = false;

      Object.values(controllers.current).forEach(
        (controller) => {
          controller?.abort();
        }
      );

      controllers.current = {};
    };
  }, [clearAllTimers]);

  // ==========================================
  // STATUS COMPATIBILITY
  // ==========================================

  const status: DashboardStatus = {
    ...itemStatus,

    // Kompatibilitas Dashboard versi sebelumnya.
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
