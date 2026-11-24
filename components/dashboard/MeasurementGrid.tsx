"use client";

import {
  Activity,
  Zap,
  Gauge,
  Waves,
  Radio,
  TrendingUp,
  AudioLines,
  Network,
} from "lucide-react";

import MetricCard from "./MetricCard";
import type { EnergyData } from "@/lib/circutor/types";

interface Props {
  data: EnergyData | null;
}

export default function MeasurementGrid({ data }: Props) {
  const metrics = [
    { title: "Voltage", value: data?.voltage ?? null, unit: "V", icon: <Zap />, decimals: 1 },
    { title: "Current", value: data?.current ?? null, unit: "A", icon: <Activity />, decimals: 2 },
    { title: "Active Power", value: data?.activePower ?? null, unit: "kW", icon: <TrendingUp /> },
    { title: "Reactive Power", value: data?.reactivePower ?? null, unit: "kvar", icon: <Waves /> },
    { title: "Apparent Power", value: data?.apparentPower ?? null, unit: "kVA", icon: <Gauge /> },
    { title: "Power Factor", value: data?.powerFactor ?? null, unit: "PF", icon: <Radio /> },
    { title: "THD Voltage", value: data?.thdv ?? null, unit: "%", icon: <AudioLines /> },
    { title: "THD Current", value: data?.thdi ?? null, unit: "%", icon: <Network /> },
    { title: "Frequency", value: data?.frequency ?? null, unit: "Hz", icon: <Activity /> },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <MetricCard key={metric.title} {...metric} />
      ))}
    </div>
  );
}