"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, Home, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileBottomNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const items = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    {
      href: "/search",
      label: "Buses",
      icon: Bus,
      active: pathname === "/search" || pathname.startsWith("/trips"),
    },
    {
      href: loggedIn ? "/bookings" : "/login?redirect=/bookings",
      label: "Bookings",
      icon: Ticket,
      active: pathname === "/bookings" || pathname.startsWith("/tickets"),
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      aria-label="Mobile"
    >
      <ul className="grid grid-cols-3">
        {items.map(({ href, label, icon: Icon, active }) => (
          <li key={label}>
            <Link
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
                active ? "text-emerald-700" : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
