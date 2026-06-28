"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useRecruiterJob,
  useJobApplications,
  useUpdateApplicationStatus,
  useDeleteRecruiterJob,
} from "@/hooks/useRecruiter";
import {
  ArrowLeft,
  Loader2,
  Briefcase,
  Building2,
  Calendar,
  Users,
  Trash2,
  ChevronDown,
  Star,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  applied: { label: "Applied", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400", icon: <Clock className="h-3.5 w-3.5" /> },
  reviewed: { label: "Reviewed", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400", icon: <Eye className="h-3.5 w-3.5" /> },
  shortlisted: { label: "Shortlisted", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", icon: <Star className="h-3.5 w-3.5" /> },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400", icon: <Users className="h-3.5 w-3.5" /> },
  hired: { label: "Hired", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400", icon: <XCircle className="h-3.5 w-3.5" /> },
};

const ALL_STATUSES = ["applied", "reviewed", "shortlisted", "interview", "hired", "rejected"];

export default function RecruiterJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = Number(params.id);
  const { data: job, isLoading: jobLoading } = useRecruiterJob(jobId);
  const { data: applicationsData, isLoading: appsLoading } = useJobApplications(jobId);
  const { mutate: updateStatus } = useUpdateApplicationStatus();
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteRecruiterJob();

  const [expandedApp, setExpandedApp] = useState<number | null>(null);

  const applications = applicationsData?.data ?? [];
  const parsedJd = job?.parsed_jd as Record<string, any> | undefined;

  const handleDelete = () => {
    if (!confirm("Delete this job and all its applications? This cannot be undone.")) return;
    deleteJob(jobId, {
      onSuccess: () => router.push("/recruiter/jobs"),
    });
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Job not found.</p>
        <Link href="/recruiter/jobs">
          <Button variant="ghost" className="mt-4">
            Go Back
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Back */}
      <Link
        href="/recruiter/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Link>

      {/* Job header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {job.title}
          </h1>
          <div className="flex items-center gap-4 mt-2 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4" />
              {job.company}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(job.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30 gap-2"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete Job
        </Button>
      </div>

      {/* Parsed JD info */}
      {parsedJd && (
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              AI-Parsed Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.isArray(parsedJd.required_skills) && parsedJd.required_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Required Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(parsedJd.required_skills as string[]).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(parsedJd.tech_stack) && parsedJd.tech_stack.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Tech Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(parsedJd.tech_stack as string[]).map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {parsedJd.seniority && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Seniority</p>
                  <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    {parsedJd.seniority as string}
                  </span>
                </div>
              )}
              {Array.isArray(parsedJd.inferred_skills) && parsedJd.inferred_skills.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Inferred Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(parsedJd.inferred_skills as string[]).map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Applications */}
      <Card className="bg-white dark:bg-slate-900 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Applicants
            {!appsLoading && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({applications.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/30" />
              <p className="text-muted-foreground">
                No applications yet. Candidates will appear here once they
                apply.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => {
                const status = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.applied;
                const candidateName =
                  (app.candidate.parsed_candidate as Record<string, unknown>)?.name as string ?? "Unknown Candidate";
                const isExpanded = expandedApp === app.id;

                return (
                  <div
                    key={app.id}
                    className="rounded-xl border border-border overflow-hidden transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-900"
                  >
                    {/* Summary row */}
                    <button
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-sm shrink-0">
                          {candidateName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {candidateName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(app.applied_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Match score */}
                        <div className="hidden sm:flex items-center gap-1.5">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-semibold text-foreground">
                            {Math.round(app.match_score)}%
                          </span>
                        </div>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${status.color}`}>
                          {status.icon}
                          {status.label}
                        </span>

                        <ChevronDown
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="border-t border-border p-4 bg-muted/20 space-y-4 animate-in slide-in-from-top-1 duration-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Match Summary */}
                          <div>
                            <p className="text-sm font-medium text-foreground mb-1">
                              Match Summary
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {app.match_summary || "No summary available."}
                            </p>
                          </div>

                          {/* Strengths */}
                          {app.strengths && app.strengths.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-foreground mb-1">
                                Strengths
                              </p>
                              <ul className="space-y-1">
                                {app.strengths.slice(0, 4).map((s, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-1.5 text-sm text-muted-foreground"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Gaps */}
                          {app.gaps && app.gaps.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-foreground mb-1">
                                Gaps
                              </p>
                              <ul className="space-y-1">
                                {app.gaps.slice(0, 4).map((g, i) => (
                                  <li
                                    key={i}
                                    className="flex items-start gap-1.5 text-sm text-muted-foreground"
                                  >
                                    <XCircle className="h-3.5 w-3.5 mt-0.5 text-red-400 shrink-0" />
                                    {g}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm" className="gap-1.5">
                                <Shield className="h-3.5 w-3.5" />
                                Change Status
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {ALL_STATUSES.filter((s) => s !== app.status).map((s) => {
                                const cfg = STATUS_CONFIG[s];
                                return (
                                  <DropdownMenuItem
                                    key={s}
                                    onClick={() =>
                                      updateStatus({ applicationId: app.id, status: s })
                                    }
                                    className="gap-2"
                                  >
                                    {cfg.icon}
                                    {cfg.label}
                                  </DropdownMenuItem>
                                );
                              })}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Link href={`/recruiter/jobs/${jobId}/applications/${app.id}`}>
                            <Button variant="default" size="sm" className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                              <Eye className="h-3.5 w-3.5" />
                              Full Report
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
