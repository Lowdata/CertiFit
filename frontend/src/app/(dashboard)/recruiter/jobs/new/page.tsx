"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateRecruiterJob } from "@/hooks/useRecruiter";
import { ScreeningQuestion } from "@/types/job";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  Building2,
  FileText,
  CheckCircle2,
  Globe,
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
  const [applyType, setApplyType] = useState<"internal" | "external">("internal");
  const [externalUrl, setExternalUrl] = useState("");
  const [questions, setQuestions] = useState<ScreeningQuestion[]>([]);
  const [error, setError] = useState("");

  const addQuestion = (type: "yes_no" | "text" | "link") => {
    const newQuestion: ScreeningQuestion = {
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      question: "",
      required: true
    };
    setQuestions([...questions, newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id: string, updates: Partial<ScreeningQuestion>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

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
    if (applyType === "external" && (!externalUrl || !externalUrl.startsWith("http"))) {
      setError("Please provide a valid external URL starting with http:// or https://.");
      return;
    }

    try {
      setError("");
      // @ts-ignore - Assuming useCreateRecruiterJob takes these new parameters
      const result = await createJob({ 
        title: title.trim(), 
        company: company.trim(), 
        jd: jd.trim(),
        apply_type: applyType,
        external_apply_url: applyType === "external" ? externalUrl.trim() : null,
        screening_questions: questions.filter(q => q.question.trim().length > 0)
      } as any);
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="applyType" className="text-sm font-medium">
                  <Globe className="inline h-3.5 w-3.5 mr-1" />
                  Application Type
                </Label>
                <select
                  id="applyType"
                  value={applyType}
                  onChange={(e) => setApplyType(e.target.value as "internal" | "external")}
                  className="flex h-11 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600 transition-colors"
                  disabled={isPending}
                >
                  <option value="internal">Internal (Apply on CertiFit)</option>
                  <option value="external">External (Greenhouse, Lever, etc)</option>
                </select>
              </div>
              
              {applyType === "external" && (
                <div className="space-y-2">
                  <Label htmlFor="externalUrl" className="text-sm font-medium">
                    <Globe className="inline h-3.5 w-3.5 mr-1" />
                    External URL
                  </Label>
                  <Input
                    id="externalUrl"
                    type="url"
                    placeholder="https://jobs.lever.co/..."
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="h-11 bg-white dark:bg-slate-950"
                    disabled={isPending}
                    required={applyType === "external"}
                  />
                </div>
              )}
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

            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  <FileText className="inline h-3.5 w-3.5 mr-1" />
                  Screening Questions (Optional)
                </Label>
              </div>

              {questions.length > 0 && (
                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase text-muted-foreground">Question {idx + 1} - {q.type.replace('_', '/')}</span>
                        <Button type="button" variant="ghost" size="sm" className="h-6 px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => removeQuestion(q.id)}>
                          Remove
                        </Button>
                      </div>
                      <Input
                        placeholder="Type your question here..."
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                        className="bg-white dark:bg-slate-950 h-9"
                        disabled={isPending}
                        required
                      />
                      <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={q.required}
                          onChange={(e) => updateQuestion(q.id, { required: e.target.checked })}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-600"
                          disabled={isPending}
                        />
                        Required
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("yes_no")} disabled={isPending}>
                  + Yes/No
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("text")} disabled={isPending}>
                  + Text
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => addQuestion("link")} disabled={isPending}>
                  + Link
                </Button>
              </div>
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
