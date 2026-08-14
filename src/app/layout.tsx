import type { Metadata, Viewport } from "next";
import { getCurrentUser } from "@/lib/auth/actions";
import { Navbar } from "@/components/layout/navbar";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SupportChat } from "@/components/support/support-chat";
import "./globals.css";

export const metadata: Metadata = {
  title: "YOBE LINE — Yobe State Bus Booking",
  description:
    "Book YOBE LINE bus tickets within Yobe and to other states. Search routes, select seats, pay with Paystack, and get e-tickets with QR verification.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentUser().catch(() => null);
  const navUser = session?.user
    ? {
        email: session.user.email ?? "",
        role: session.profile?.role ?? ("passenger" as const),
      }
    : null;

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col overflow-x-clip bg-slate-50 font-sans text-slate-900 antialiased">
        <Navbar user={navUser} />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <footer className="hidden border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500 md:block">
          © {new Date().getFullYear()} YOBE LINE — Yobe State Bus Booking
        </footer>
        <MobileBottomNav loggedIn={Boolean(navUser)} />
        <SupportChat />
      </body>
    </html>
  );
}
