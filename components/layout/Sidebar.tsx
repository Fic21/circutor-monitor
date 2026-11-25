
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Settings,
  Cpu,
  Radio,
  Zap,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "History",
    href: "/measurements",
    icon: Activity,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Firmware",
    href: "/firmware",
    icon: Cpu,
  },
  {
    name: "Communication",
    href: "/communication",
    icon: Radio,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden min-h-screen w-64 shrink-0 bg-slate-950 p-5 text-white md:block">
      <div className="mb-10 flex items-center gap-3">
        <div className="rounded-lg bg-blue-600 p-3">
          <Zap size={26} />
        </div>

        <div>
          <h1 className="font-bold">CIRCUTOR C6 WiFi</h1>
          <p className="text-xs text-slate-400">
            Monitoring Capasitor Bank
          </p>
          <p className="text-xs text-slate-200">Indochemical Citra Kimia</p>
        </div>
      </div>

      <p className="mb-3 text-xs uppercase tracking-wider text-slate-500">
        Main Menu
      </p>

      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
