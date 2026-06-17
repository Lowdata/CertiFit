"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { UploadCloud, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CandidateProfilePage() {
  const { user } = useAuthStore();
  // Simulate resume upload state for the onboarding experience
  const [hasResume, setHasResume] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setHasResume(true);
    }, 2000);
  };

  if (!hasResume) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center text-center max-w-2xl mx-auto px-4">
        <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
          <UploadCloud className="h-10 w-10" />
        </div>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome to CertiFit, {user?.name?.split(" ")[0] || "Candidate"}!
        </h1>
        <p className="mb-10 text-lg text-slate-600 dark:text-slate-400">
          Your resume is the core of your profile. Our AI will instantly parse your experience, calculate your trust score, and match you with the best roles.
        </p>
        
        <div className="w-full max-w-md rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 transition-colors hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-900/50">
          <Button 
            onClick={handleSimulateUpload} 
            disabled={isUploading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isUploading ? "Uploading & Analyzing..." : "Upload your Resume (PDF/DOCX)"}
          </Button>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-500">
            Secure and private. We never share your data without permission.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Your Profile
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Manage your professional identity and trust scores.
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Update Resume
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Profile Strength</h3>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 mb-2">
            <div className="bg-emerald-500 h-2.5 rounded-full w-[85%]"></div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your profile is looking great! Ready to apply for jobs.</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-2">Trust Score</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">92</span>
            <span className="text-sm text-slate-500">/ 100</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Based on verified employment history and LinkedIn.</p>
        </div>
      </div>
    </div>
  );
}
