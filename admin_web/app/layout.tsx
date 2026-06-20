import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ShieldCheckIcon } from "@/components/icons";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GovPath — Officer Verification Portal",
  description:
    "Human-in-the-loop review dashboard for government officers to verify and authorize citizen service plan packets.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 bg-gradient-to-r from-primary-dark via-primary to-primary-light text-white shadow-lg shadow-primary/20">
          {/* government-seal gold accent line */}
          <div className="h-0.5 w-full bg-accent/80" />
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur-sm">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold leading-tight tracking-tight">
                  GovPath
                </h1>
                <p className="text-[11px] font-medium uppercase leading-tight tracking-[0.14em] text-white/65">
                  Officer Verification Portal
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/80 ring-1 ring-inset ring-white/15 sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Live
              </span>
              <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3 ring-1 ring-inset ring-white/15">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/90 text-xs font-bold text-primary-dark">
                  VO
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-xs font-semibold text-white">
                    Verifying Officer
                  </p>
                  <p className="text-[10px] text-white/60">On duty</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200/70 bg-white/60">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3 text-xs text-slate-500">
            <span>
              GovPath · Human-in-the-loop government service verification
            </span>
            <span className="text-slate-400">AgenTriX 2026 · Team Adagard</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
