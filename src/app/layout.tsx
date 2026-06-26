import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "77Days Property OS",
  description: "Portfolio dashboard MVP"
};

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/property-summary", label: "Property Summary" },
  { href: "/bank-summary", label: "Bank Summary" },
  { href: "/expenses", label: "Expenses" }
];

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans antialiased">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-ink/10 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded bg-ink text-sm font-bold text-white">
                77
              </span>
              <div>
                <p className="text-lg font-semibold leading-none text-ink">
                  77Days Property OS
                </p>
                <p className="mt-1 text-sm text-ink/60">Portfolio MVP</p>
              </div>
            </Link>
            <nav className="flex flex-wrap gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-moss/40 hover:text-moss"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </header>
          <main className="flex-1 py-6 sm:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
