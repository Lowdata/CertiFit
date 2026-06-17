import { CheckCircle2 } from "lucide-react";
import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 text-slate-900">
      {/* Left Side: Branding (Hidden on mobile, or stacked above) */}
      <div className="relative flex-col justify-between hidden lg:flex p-12 lg:p-20 border-r border-slate-200 bg-white overflow-hidden">
        {/* Soft slate radial pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-slate-100 via-white to-white pointer-events-none" />
        
        {/* Subtle mesh/graph background hint */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-16">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">C</span>
            </div>
            <span className="font-bold text-xl tracking-tight">CertiFit</span>
          </div>

          <div className="max-w-md">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600 mb-6">
              AI-Powered Recruitment Intelligence
            </div>
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight mb-4 text-slate-900">
              Hire with Evidence.
            </h1>
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              AI-powered candidate verification and interview intelligence.
            </p>

            <ul className="space-y-4 mb-12">
              {[
                "Resume Intelligence",
                "Trust Verification",
                "Candidate Ranking",
                "Interview Copilot",
              ].map((feature, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-700 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="pt-8 border-t border-slate-100">
            <p className="text-sm font-medium text-slate-500 leading-relaxed">
              Helping recruiters make better hiring decisions through observable evidence.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form Container */}
      <div className="flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8 relative bg-[#FAFAFA]">
        {/* Mobile Header (Shows only on mobile) */}
        <div className="flex items-center gap-2 mb-8 lg:hidden justify-center">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-xl leading-none">C</span>
          </div>
          <span className="font-bold text-xl tracking-tight">CertiFit</span>
        </div>

        <div className="mx-auto w-full max-w-[450px]">
          {children}
        </div>
      </div>
    </div>
  );
}
