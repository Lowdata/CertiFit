"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Sparkles,
  Search,
  Users,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  const features = [
    {
      icon: Sparkles,
      title: "AI matching",
      description:
        "Every resume is scored against the skills and experience your role actually needs, not just keyword overlap.",
    },
    {
      icon: Search,
      title: "Smart screening",
      description:
        "Filter out the noise automatically and surface the candidates worth your time, with the reasoning behind every score.",
    },
    {
      icon: Users,
      title: "Collaborative pipelines",
      description:
        "Move candidates through your hiring stages with your whole team in the loop. No spreadsheets required.",
    },
    {
      icon: BarChart3,
      title: "Hiring insights",
      description:
        "See time-to-hire, pipeline health, and where candidates drop off, all from one dashboard.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Post a role",
      description:
        "Tell CertiFit what the job needs. We learn the must-haves, the nice-to-haves, and everything in between.",
    },
    {
      number: "02",
      title: "Get matched",
      description:
        "As candidates apply, they're scored and ranked automatically against your real requirements.",
    },
    {
      number: "03",
      title: "Hire with confidence",
      description:
        "Review a shortlist you trust, see why each candidate ranked where they did, and move straight to interviews.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-300">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-[#FAFAFA]/80 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-semibold">
              C
            </div>
            <span className="text-lg font-semibold tracking-tight">CertiFit</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Product
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              How it works
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all"
            >
              Get started
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-600 dark:text-slate-400"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#features" className="text-sm text-slate-600 dark:text-slate-400">
                Product
              </a>
              <a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-400">
                How it works
              </a>
              <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-center text-sm font-medium text-white"
              >
                Get started
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(37, 99, 235, 0.06), transparent 40%), radial-gradient(circle at 80% 0%, rgba(37, 99, 235, 0.05), transparent 35%)",
          }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-16 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered recruitment intelligence
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
              Hire the right person, every time.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              CertiFit reads through every resume, ranks candidates against what your role
              actually needs, and hands your team a shortlist worth reviewing, not a stack of
              profiles to sift through.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-3 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Hero visual: product mockup */}
          <div className="relative">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-colors duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Senior Product Designer
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">12 candidates</span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {[
                  { name: "M. Okafor", score: 96 },
                  { name: "S. Lindqvist", score: 89 },
                  { name: "R. Castillo", score: 74 },
                ].map((c) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {c.name.split(" ")[1][0]}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {c.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        c.score >= 90
                          ? "text-emerald-500 dark:text-emerald-400"
                          : c.score >= 80
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-amber-500 dark:text-amber-500"
                      }`}
                    >
                      {c.score}% fit
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* floating accent badge */}
            <div className="absolute -bottom-4 -left-4 hidden items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 shadow-md sm:flex">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Shortlist ready
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 transition-colors duration-300"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              Everything your team needs to hire well
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              CertiFit handles the repetitive parts of recruiting so your team can spend its
              time on the conversations that matter.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-colors duration-300"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
                  <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
              From job post to offer letter
            </h2>
            <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Three steps, start to finish.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                  {step.number}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 transition-colors duration-300">
        <div className="mx-auto max-w-6xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Spend less time screening, more time hiring.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Create an account and post your first role in minutes.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-medium text-white shadow-md hover:shadow-lg transition-all"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
              C
            </div>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              CertiFit
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} CertiFit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}