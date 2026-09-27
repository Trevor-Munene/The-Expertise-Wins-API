// frontend/src/components/Footer.jsx
import Link from "next/link";
import { Send, ShieldCheck, Trophy, Crown } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-bold">
                <Trophy className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-white text-base">The Expertise Wins</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Data-driven sports predictions, normalized odds curation, transparent performance tracking, and direct VIP channel integration.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://t.me/+D_jIXFB807E0NmRk"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 text-xs font-semibold transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Join Official Telegram</span>
              </a>
              <a
                href="https://t.me/pikkbetter"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 text-xs font-semibold transition-all"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>DM @PIKKBETTER</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Navigation</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">Home Overview</Link>
              </li>
              <li>
                <Link href="/tips" className="hover:text-emerald-400 transition-colors">Free & VIP Tips</Link>
              </li>
              <li>
                <Link href="/stats" className="hover:text-emerald-400 transition-colors">Win Rate & Analytics</Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition-colors">Subscriptions & Access Tokens</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">System Information</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              All tips are generated and verified via standard normalization engines. Responsible betting only (18+).
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Curation Engine</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} The Expertise Wins. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Powered by Next.js & Express API</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
