import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

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
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <header className="bg-primary text-white shadow-sm">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/15 font-bold tracking-tight">
              GP
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">GovPath</h1>
              <p className="text-xs leading-tight text-white/70">
                Officer Verification Portal
              </p>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-3 text-xs text-slate-500">
            GovPath · AgenTriX 2026 · Team Adagard — Human-in-the-loop government
            service verification
          </div>
        </footer>
      </body>
    </html>
  );
}
