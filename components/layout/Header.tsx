import { Bell, RefreshCw } from "lucide-react";

interface Props {
  connected: boolean;
  lastUpdated: string | null;
  onRefresh: () => void;
}

export default function Header({
  connected,
  lastUpdated,
  onRefresh,
}: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">
          Energy Overview
        </h2>
        <p className="text-xs text-slate-500">
          CIRCUTOR Computer C6
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-slate-600">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <button
          onClick={onRefresh}
          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
          title="Refresh data"
        >
          <RefreshCw size={18} />
        </button>

        <Bell size={19} className="text-slate-500" />

        <span className="hidden text-xs text-slate-500 sm:block">
          Updated: {lastUpdated ?? "--"}
        </span>
      </div>
    </header>
  );
}