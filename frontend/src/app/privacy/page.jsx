import Link from "next/link";
import {
Database,
Eye,
Heart,
Lock,
Mail,
ShieldCheck,
UserRound,
} from "lucide-react";

export const metadata = {
title: "Privacy Policy",
description:
"Learn how The Expertise Wins collects, uses, and protects your information.",
};

export default function PrivacyPage() {
return ( <main className="relative overflow-hidden py-14 sm:py-24">
{/* Background glow */} <div
     className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none"
     aria-hidden="true"
   />

```
  <section className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    {/* Icon */}
    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
      <ShieldCheck className="w-8 h-8" aria-hidden="true" />
    </div>

    {/* Heading */}
    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300 mt-7">
      Privacy &amp; data
    </p>

    <h1 className="text-4xl sm:text-6xl font-black text-slate-100 tracking-tight mt-3">
      Your privacy matters.
    </h1>

    <p className="text-slate-300 text-base sm:text-lg leading-relaxed mt-6 max-w-2xl mx-auto">
      Here&apos;s how The Expertise Wins collects, uses, and protects
      information when you use our website and services.
    </p>

    <p className="text-xs text-slate-500 mt-4">
      Last updated: September 30, 2026
    </p>

    {/* Privacy card */}
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 mt-10 text-left shadow-2xl shadow-black/10">
      {/* Introduction */}
      <div className="flex items-start gap-4 mb-8">
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 shrink-0">
          <Lock className="w-5 h-5" aria-hidden="true" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-white">
            Our approach
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed mt-1">
            We aim to collect only the information reasonably needed to
            operate the service, provide account functionality, maintain
            security, and improve The Expertise Wins.
          </p>
        </div>
      </div>

      {/* Information we collect */}
      <div className="border-t border-slate-800 pt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <Database className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Information We Collect
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3 space-y-4">
              <p>
                When you create an account or use The Expertise Wins, we
                may collect information such as your name, username, email
                address, account credentials, subscription information,
                and access-token activity.
              </p>

              <p>
                We may also collect basic technical information such as
                your browser, device, IP address, and diagnostic information
                where necessary for security and service operation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How we use information */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <Eye className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              How We Use Information
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3">
              <ul className="space-y-2 list-disc pl-5">
                <li>Creating and managing user accounts.</li>
                <li>Providing free and premium content.</li>
                <li>Managing subscriptions and access tokens.</li>
                <li>Verifying payments and subscription access.</li>
                <li>Providing sports tips and performance analytics.</li>
                <li>Maintaining security and preventing abuse.</li>
                <li>Improving the website and user experience.</li>
                <li>Communicating with you about the service.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Account and access */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <UserRound className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Accounts &amp; Access
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3 space-y-4">
              <p>
                You are responsible for keeping your account credentials
                secure. Please do not share your password or account
                credentials with other people.
              </p>

              <p>
                Premium access may use access tokens or subscription
                verification. We may record whether an access token has
                been redeemed, revoked, or used so that access can be
                managed correctly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sports data */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <ShieldCheck className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Sports Tips &amp; Performance Data
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3 space-y-4">
              <p>
                The Expertise Wins maintains information relating to
                published sports tips, including selections, markets,
                odds, competitions, results, and performance statistics.
              </p>

              <p>
                This information is used to publish tips, track historical
                performance, and provide analytics. Historical performance
                does not guarantee future results.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <Lock className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Security
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3 space-y-4">
              <p>
                We take reasonable measures to protect information against
                unauthorized access, alteration, disclosure, or destruction.
              </p>

              <p>
                These measures may include authenticated access, password
                protection, access controls, secure server configuration,
                and other technical safeguards appropriate to the service.
              </p>

              <p>
                No internet service can guarantee absolute security, so we
                encourage you to use a strong password and keep your
                account credentials private.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Third parties */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <Database className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Third-Party Services
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3 space-y-4">
              <p>
                Some parts of The Expertise Wins may rely on third-party
                providers for hosting, infrastructure, payments,
                communication, analytics, or other functionality.
              </p>

              <p>
                These providers may process information according to their
                own terms and privacy policies.
              </p>

              <p>
                Our website may also contain links to external services
                such as Telegram, social platforms, payment services, and
                betting platforms. Their own privacy policies apply when
                you use those services.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cookies */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <Eye className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Cookies &amp; Local Storage
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed mt-3">
              The website may use cookies, local storage, or similar
              technologies to maintain sessions, keep you signed in,
              remember preferences, and support essential functionality.
            </p>
          </div>
        </div>
      </div>

      {/* Your rights */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-300 shrink-0">
            <UserRound className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Your Information
            </h2>

            <div className="text-sm text-slate-400 leading-relaxed mt-3 space-y-4">
              <p>
                Depending on applicable law, you may have rights relating
                to the personal information we hold about you, including
                the ability to request access, correction, or deletion
                where applicable.
              </p>

              <p>
                Some information may need to be retained where there is a
                legitimate operational or legal reason to do so.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="border-t border-slate-800 pt-8 mt-8">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-300 shrink-0">
            <Mail className="w-5 h-5" aria-hidden="true" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Questions about your privacy?
            </h2>

            <p className="text-sm text-slate-400 leading-relaxed mt-3">
              If you have questions about your information or this Privacy
              Policy, contact us directly.
            </p>

            <a
              href="mailto:midwaymaster10@gmail.com"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-300 hover:text-emerald-200 mt-4 rounded focus:outline-none focus:ring-2 focus:ring-emerald-400/50 px-1 py-1"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              midwaymaster10@gmail.com
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Privacy message */}
    <div className="flex items-center justify-center gap-2 text-xs text-emerald-300 mt-7">
      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
      <span>Clear information. Responsible data handling.</span>
    </div>

    {/* Navigation */}
    <Link
      href="/about"
      className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white mt-8 rounded focus:outline-none focus:ring-2 focus:ring-slate-400/50 px-2 py-1"
    >
      <Heart
        className="w-4 h-4 text-rose-400"
        aria-hidden="true"
      />
      Learn more about the project
    </Link>
  </section>
</main>
);
}
