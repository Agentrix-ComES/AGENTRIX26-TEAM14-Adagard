import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { GovPathLogoIcon } from "@/components/icons";

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
        <header className="sticky top-0 z-30 overflow-hidden bg-gradient-to-r from-primary-dark via-primary to-primary-light text-white shadow-xl shadow-primary/25">
          {/* Gold accent rule */}
          <div className="h-[3px] w-full bg-gradient-to-r from-accent via-accent-light to-accent" />

          <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
            {/* Subtle dot-grid texture overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            {/* Brand */}
            <div className="relative flex items-center gap-3.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur-sm">
                <GovPathLogoIcon width={30} height={30} />
              </div>
              <div>
                <h1 className="text-[18px] font-bold leading-tight tracking-tight">
                  GovPath
                </h1>
                <p className="text-[10px] font-semibold uppercase leading-tight tracking-[0.18em] text-white/60">
                  Officer Verification Portal
                </p>
              </div>
            </div>

            {/* Status + user */}
            <div className="relative flex items-center gap-3">
              <span className="hidden items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/85 ring-1 ring-inset ring-white/20 sm:inline-flex">
                <span className="animate-glow-pulse h-2 w-2 rounded-full bg-emerald-400" />
                Live
              </span>
              <div className="flex items-center gap-2.5 rounded-full bg-white/10 py-1 pl-1 pr-3.5 ring-1 ring-inset ring-white/20">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-accent-light text-xs font-bold text-primary-dark shadow-sm">
                  VO
                </span>
                <div className="hidden leading-tight sm:block">
                  <p className="text-xs font-semibold text-white">Verifying Officer</p>
                  <p className="text-[10px] text-white/55">On duty</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-6 py-3 text-xs text-slate-400">
            <span className="font-medium text-slate-500">
              GovPath · Human-in-the-loop government service verification
            </span>
            <span className="font-medium text-accent">AgenTriX 2026 · Team Adagard</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
