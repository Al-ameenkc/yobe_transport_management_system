"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bus, LogIn, LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/database";

interface NavbarProps {
  user?: { email: string; role: UserRole } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-bold text-emerald-700">
          <Bus className="h-6 w-6 shrink-0" />
          <span className="truncate">YOBE LINE</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link
            href="/search"
            className={pathname === "/search" ? "text-emerald-700" : "hover:text-emerald-700"}
          >
            Available Buses
          </Link>
          {user && (
            <Link
              href="/bookings"
              className={pathname === "/bookings" ? "text-emerald-700" : "hover:text-emerald-700"}
            >
              My Bookings
            </Link>
          )}
          {user && ["admin", "staff"].includes(user.role) && (
            <Link
              href="/admin/dashboard"
              className={pathname.startsWith("/admin") ? "text-emerald-700" : "hover:text-emerald-700"}
            >
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 sm:inline">
                <User className="mr-1 inline h-4 w-4" />
                {user.email}
              </span>
              {["admin", "staff"].includes(user.role) && (
                <Link href="/admin/dashboard">
                  <Button variant="outline" size="sm">
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">
                <LogIn className="h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
