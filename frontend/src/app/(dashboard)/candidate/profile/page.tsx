import { Metadata } from "next";
import { ResumeUpload } from "@/components/candidate/resume-upload";
import { ProfileDisplay } from "@/components/candidate/profile-display";

export const metadata: Metadata = {
  title: "Candidate Profile | CertiFit",
  description: "Manage your candidate profile and upload your resume.",
};

export default function CandidateProfilePage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Profile Setup</h2>
          <p className="text-slate-500 dark:text-slate-400">
            Upload your resume and connect integrations to automatically generate your verified candidate profile.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <ResumeUpload />
          
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/50 dark:bg-blue-900/10">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">How it works</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
              When you upload your resume, CertiFit's AI engine automatically extracts your skills, experience, and timeline. 
              Linking your GitHub adds verifiable evidence to your technical skills.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ProfileDisplay />
        </div>
      </div>
    </div>
  );
}
