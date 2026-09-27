// frontend/src/app/layout.jsx
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ToastProvider from "../components/ToastProvider";

export const metadata = {
  title: "The Expertise Wins — Verified Daily Sports Betting Tips & Analytics",
  description:
    "Data-driven betting tips, odds normalization engine, transparent ROI stats, and dedicated VIP access channels.",
  keywords: ["betting tips", "free tips", "VIP tips", "football predictions", "odds normalization", "sports stats"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 flex flex-col min-h-screen antialiased selection:bg-emerald-500 selection:text-slate-950">
        <ToastProvider />
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
