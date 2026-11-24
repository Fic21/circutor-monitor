"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import type { EnergyData } from "@/lib/circutor/types";

interface Props {
  data: EnergyData | null;
}

interface HistoryItem {
  time: string;
  power: number;
}

export default function PowerChart({ data }: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    if (!data) return;

    setHistory((previous) => [
      ...previous,
      {
        time: new Date().toLocaleTimeString("id-ID"),
        power: data.activePower,
      },
    ].slice(-60));
  }, [data?.updatedAt]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-5 font-semibold text-slate-800">
        Active Power History
      </h2>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={30} />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="power"
              name="Active Power"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}