import { ReactNode } from "react";

interface Props {
  title: string;
  value: number | null;
  unit: string;
  icon: ReactNode;
  decimals?: number;
}

export default function MetricCard({
  title,
  value,
  unit,
  icon,
  decimals = 2,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>
        <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
          {icon}
        </div>
      </div>

      <div className="mt-5 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-slate-900">
          {value === null ? "--" : value.toFixed(decimals)}
        </span>

        <span className="text-sm text-slate-500">
          {unit}
        </span>
      </div>
    </div>
  );
}