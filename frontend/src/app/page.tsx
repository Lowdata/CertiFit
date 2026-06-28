"use client";

import Link from "next/link";
import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import {
  Sparkles,
  Search,
  Users,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  BrainCircuit,
  Zap,
} from "lucide-react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  const { token, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (mounted && token && user) {
      if (user.user_type === 1) {
        router.replace("/recruiter");
      } else {
        router.replace("/candidate");
      }
    }
  }, [mounted, token, user, router]);

  const features = [
    {
      icon: BrainCircuit,
      title: "Contextual AI Matching",
      description:
        "We move beyond keyword matching. Our AI understands the semantic context of both your job description and candidate experience, scoring true capability.",
      colSpan: "md:col-span-2 lg:col-span-2",
    },
    {
      icon: Search,
      title: "Precision Screening",
      description:
        "Instantly filter out noise. Focus your team's time only on candidates mathematically aligned with your hiring goals.",
      colSpan: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: ShieldCheck,
      title: "Observable Evidence",
      description:
        "Every score comes with citations. See exactly why a candidate matched (or didn't) based on verifiable data.",
      colSpan: "md:col-span-1 lg:col-span-1",
    },
    {
      icon: Users,
      title: "Collaborative Pipelines",
      description:
        "Seamlessly move candidates through interview stages. Share scores, insights, and feedback without leaving the platform.",
      colSpan: "md:col-span-2 lg:col-span-2",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Define the Role",
      description:
        "Input your job requirements. Our AI parses the nuances of what success looks like for the position.",
    },
    {
      number: "02",
      title: "Intelligent Intake",
      description:
        "Candidates apply and are immediately analyzed against the core competencies and nice-to-haves.",
    },
    {
      number: "03",
      title: "Hire with Certainty",
      description:
        "Review an evidence-backed shortlist, conduct confident interviews, and make your final decision.",
    },
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-500 overflow-x-hidden selection:bg-blue-200 dark:selection:bg-blue-900/50">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-400/10 dark:bg-blue-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-400/5 dark:bg-emerald-600/10 blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 z-10">
        <div className="mx-auto max-w-6xl px-6 grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="max-w-2xl">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both inline-flex items-center gap-2 rounded-full border border-blue-200/50 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/20 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Enterprise Recruitment Intelligence
            </div>

            <h1 className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both mt-6 text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Hire with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                absolute
              </span>{" "}
              certainty.
            </h1>

            <p className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300 fill-mode-both mt-6 text-lg sm:text-xl leading-relaxed text-slate-600 dark:text-slate-400 max-w-lg">
              Stop guessing. CertiFit reads every resume, parses observable skills, and delivers an evidence-backed shortlist tailored precisely to your role.
            </p>

            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500 fill-mode-both mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-105 transition-all duration-300"
              >
                Start hiring smarter
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm px-8 py-4 text-sm font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                See how it works
              </Link>
            </div>
            
            <div className="animate-in fade-in duration-1000 delay-700 fill-mode-both mt-10 flex items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              <div className="flex -space-x-2">
                {[1,2,3,4].map((i) => (
                  <div key={i} className={`w-8 h-8 rounded-full border-2 border-[#FAFAFA] dark:border-slate-950 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-300 z-[${5-i}]`}>
                    {String.fromCharCode(64+i)}
                  </div>
                ))}
              </div>
              <p>Trusted by forward-thinking teams</p>
            </div>
          </div>

          {/* Floating Glass Mockup */}
          <div className="relative animate-in fade-in zoom-in-95 duration-1000 delay-300 fill-mode-both lg:ml-auto w-full max-w-md">
            {/* Soft glow behind the card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
            
            <div className="relative rounded-3xl border border-white/40 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60 backdrop-blur-2xl p-6 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] transform lg:-rotate-2 hover:rotate-0 transition-transform duration-500 group">
              
              <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-700/50 pb-4 mb-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Senior ML Engineer</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Top Matches</p>
                </div>
                <div className="px-2.5 py-1 rounded-md bg-blue-100/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                  142 Processed
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { name: "Dr. Alex Chen", role: "AI Researcher", score: 98, trend: "up" },
                  { name: "Sarah Jenkins", role: "Lead Data Scientist", score: 92, trend: "up" },
                  { name: "Marcus Webb", role: "ML Operations", score: 87, trend: "neutral" },
                ].map((c, i) => (
                  <div
                    key={c.name}
                    className="flex items-center justify-between rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 p-4 shadow-sm group-hover:-translate-y-1 transition-transform duration-300"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-800/20 text-sm font-bold text-blue-700 dark:text-blue-300">
                        {c.name.split(" ")[1][0]}
                      </div>
                      <div>
                        <span className="block text-sm font-bold text-slate-900 dark:text-white">
                          {c.name}
                        </span>
                        <span className="block text-xs text-slate-500 dark:text-slate-400">
                          {c.role}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block text-lg font-black tracking-tight ${
                        c.score >= 95 ? "text-emerald-600 dark:text-emerald-400" :
                        c.score >= 90 ? "text-blue-600 dark:text-blue-400" :
                        "text-slate-600 dark:text-slate-300"
                      }`}>
                        {c.score}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Match</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Floating accent badge */}
              <div className="absolute -bottom-6 -left-6 hidden items-center gap-2 rounded-2xl border border-white/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-5 py-4 shadow-xl sm:flex animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">
                    Evidence Verified
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    Github & Portfolio matched
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 py-24 bg-white/40 dark:bg-slate-900/20 border-y border-slate-200/50 dark:border-slate-800/50 backdrop-blur-lg">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              An intelligent pipeline, designed for clarity.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Stop digging through unstructured resumes. We extract the signal from the noise.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-[minmax(200px,auto)]">
            {features.map((feature, _i) => (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-3xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-8 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/10 transition-all duration-500 hover:-translate-y-1 ${feature.colSpan}`}
              >
                {/* Hover gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-400 mt-auto">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              Frictionless from post to offer.
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Three simple steps to transform how your company hires.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent" />
            
            {steps.map((step, _i) => (
              <div key={step.number} className="relative text-center px-4">
                <div className="relative z-10 mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-[#FAFAFA] dark:border-slate-950 bg-slate-100 dark:bg-slate-900 shadow-xl mb-8 group hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl font-black text-slate-400 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-sm md:text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-24 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/40 dark:bg-slate-900/20 backdrop-blur-lg">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
            Ready to upgrade your hiring?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10">
            Join the teams that use observable evidence to build extraordinary companies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              <Zap className="h-5 w-5" />
              Get started for free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-4 text-base font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors w-full sm:w-auto"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 py-10 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-bold shadow-md">
              C
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              CertiFit
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-500">
            © {new Date().getFullYear()} CertiFit Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}