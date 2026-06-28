"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRecruiterJob } from "@/hooks/useRecruiter";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  Building2,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function NewJobPage() {
  const router = useRouter();
  const { mutateAsync: createJob, isPending } = useCreateRecruiterJob();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !company.trim() || !jd.trim()) {
      setError("All fields are required.");
      return;
    }
    if (jd.trim().length < 50) {
      setError("Job description must be at least 50 characters.");
      return;
    }

    try {
      setError("");
      const result = await createJob({ title: title.trim(), company: company.trim(), jd: jd.trim() });
      router.push(`/recruiter/jobs/${result.id}`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      setError(axiosError?.response?.data?.detail || "Failed to create job. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Back link */}
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Post a New Job
        </h1>
        <p className="text-muted-foreground mt-1">
          CertiFit AI will automatically parse your job description and start
          matching qualified, trust-verified candidates.
        </p>
      </div>

      {/* Tips */}
      <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2">
            Tips for a great JD
          </h3>
          <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-300">
            {[
              "Include required skills and technologies",
              "Specify seniority level (Junior, Mid, Senior)",
              "List nice-to-have skills separately",
              "Mention years of experience needed",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  <Briefcase className="inline h-3.5 w-3.5 mr-1" />
                  Job Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-950"
                  disabled={isPending}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium">
                  <Building2 className="inline h-3.5 w-3.5 mr-1" />
                  Company
                </Label>
                <Input
                  id="company"
                  placeholder="e.g. Acme Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="h-11 bg-white dark:bg-slate-950"
                  disabled={isPending}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jd" className="text-sm font-medium">
                <FileText className="inline h-3.5 w-3.5 mr-1" />
                Job Description
              </Label>
              <textarea
                id="jd"
                placeholder="Paste the full job description here. CertiFit AI will automatically extract required skills, tech stack, seniority level, and more..."
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                className="flex w-full rounded-lg border border-border bg-white dark:bg-slate-950 px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 focus-visible:border-blue-600 transition-colors min-h-[250px] resize-y"
                disabled={isPending}
                required
              />
              <p className="text-xs text-muted-foreground">
                {jd.length} characters · minimum 50
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-800/50 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {error}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-6"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating & Parsing…
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Job
                  </>
                )}
              </Button>
              <Link href="/recruiter/jobs">
                <Button type="button" variant="ghost" disabled={isPending}>
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function Plus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
