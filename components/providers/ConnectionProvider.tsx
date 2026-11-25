
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ConnectionStatus =
  | "checking"
  | "connected"
  | "disconnected"
  | "connecting"
  | "disconnecting";

type ConnectionContextType = {
  status: ConnectionStatus;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
};

const ConnectionContext = createContext<ConnectionContextType | null>(null);

export function ConnectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [status, setStatus] = useState<ConnectionStatus>("checking");

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch("/api/circutor/connection", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal memeriksa koneksi");
      }

      const result = await response.json();

      setStatus(result.connected ? "connected" : "disconnected");
    } catch {
      setStatus("disconnected");
    }
  }, []);

  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const connect = useCallback(async () => {
    if (status === "connecting" || status === "connected") return;

    setStatus("connecting");

    try {
      const response = await fetch("/api/circutor/connection", {
        method: "POST",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.connected) {
        throw new Error(result.error || "Gagal menghubungkan CIRCUTOR");
      }

      setStatus("connected");
    } catch (error) {
      setStatus("disconnected");
      throw error;
    }
  }, [status]);

  const disconnect = useCallback(async () => {
    if (status === "disconnecting" || status === "disconnected") return;

    setStatus("disconnecting");

    try {
      const response = await fetch("/api/circutor/connection", {
        method: "DELETE",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Gagal memutus koneksi CIRCUTOR");
      }

      setStatus("disconnected");
    } catch (error) {
      await checkConnection();
      throw error;
    }
  }, [status, checkConnection]);

  const value: ConnectionContextType = {
    status,
    isConnected: status === "connected",
    connect,
    disconnect,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);

  if (!context) {
    throw new Error(
      "useConnection harus digunakan di dalam ConnectionProvider"
    );
  }

  return context;
}
