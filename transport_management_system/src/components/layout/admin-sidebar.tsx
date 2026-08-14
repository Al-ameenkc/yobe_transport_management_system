"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Bus,
  Route,
  Calendar,
  Ticket,
  BarChart3,
  Users,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
const links = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/buses", label: "Buses", icon: Bus },
  { href: "/admin/routes", label: "Routes", icon: Route },
  { href: "/admin/schedules", label: "Schedules", icon: Calendar },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/verify", label: "Verify Ticket", icon: Ticket },
  { href: "/admin/drivers", label: "Drivers", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/insights", label: "AI Insights", icon: MessageCircle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 bg-slate-50 p-4">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          YOBE LINE Admin
        </p>
      </div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === href
                ? "bg-emerald-100 text-emerald-800"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="mt-8 border-t border-slate-200 pt-4">
        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}