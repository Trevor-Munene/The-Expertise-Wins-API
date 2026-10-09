// frontend/src/app/layout.jsx
import "./globals.css";
import Script from "next/script";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ToastProvider from "../components/ToastProvider";
import { SITE_URL } from "../lib/seo";

export const metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "The Expertise Wins — Sports Tips & Analytics",
    template: "%s | The Expertise Wins",
  },

  description:
    "Daily sports betting tips, transparent performance analytics, curated selections, and dedicated VIP access from The Expertise Wins.",

  keywords: [
    "betting tips",
    "free betting tips",
    "VIP betting tips",
    "football predictions",
    "sports predictions",
    "sports betting analytics",
    "betting statistics",
  ],

  applicationName: "The Expertise Wins",

  authors: [
    {
      name: "The Expertise Wins",
    },
  ],

  creator: "The Expertise Wins",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "The Expertise Wins — Sports Tips & Analytics",
    description:
      "Daily sports tips, transparent performance analytics, curated selections, and VIP access.",
    type: "website",
    siteName: "The Expertise Wins",
  },

  twitter: {
    card: "summary_large_image",
    title: "The Expertise Wins — Sports Tips & Analytics",
    description:
      "Daily sports tips, transparent performance analytics, curated selections, and VIP access.",
  },

  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col text-slate-100 antialiased selection:bg-emerald-400 selection:text-slate-950">
        <Script id="theme-preference" strategy="beforeInteractive">
          {`try {
  var savedTheme = localStorage.getItem("tew-theme");
  var preferredTheme = savedTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(preferredTheme);
} catch (_) {}`}
        </Script>
        <ToastProvider />

        <Navbar />

        <main className="flex flex-1 flex-col">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}
