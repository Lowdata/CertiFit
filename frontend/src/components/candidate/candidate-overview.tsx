"use client";

import React from "react";
import { useCandidateProfile, useCandidateNormalizedProfile, useUploadResume } from "@/hooks/use-candidate";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Briefcase,
  GraduationCap,
  CalendarDays,
  Star,
  UploadCloud,
  Loader2,
  AlertCircle,
} from "lucide-react";

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Present";
  // Accept ISO strings, YYYY-MM, YYYY formats
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatUploadDate(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function CandidateOverview() {
  const { data: profileResponse, isLoading: isLoadingRaw } = useCandidateProfile();
  const { data: normalizedResponse, isLoading: isLoadingNormalized } = useCandidateNormalizedProfile();
  const { mutate: uploadResume, isPending: isUploadingResume } = useUploadResume();
  const resumeInputRef = React.useRef<HTMLInputElement>(null);
  const [resumeError, setResumeError] = React.useState<string | null>(null);

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeError(null);
      uploadResume(file, {
        onError: (err: unknown) => {
          const axiosError = err as { response?: { data?: { detail?: string } } };
          setResumeError(
            axiosError?.response?.data?.detail ?? "Failed to upload resume"
          );
        },
      });
    }
    if (resumeInputRef.current) resumeInputRef.current.value = "";
  };

  if (isLoadingRaw || isLoadingNormalized) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-3 flex-wrap">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  const profile = normalizedResponse?.normalized_profile;
  const rawProfile = profileResponse?.parsed_candidate;

  const name = profile?.name ?? rawProfile?.name ?? "Your Profile";
  const headline = profile?.headline ?? rawProfile?.current_role ?? null;
  const yearsExp = profile?.years_experience ?? rawProfile?.years_experience ?? null;
  const skills = (profile?.verified_skills ?? rawProfile?.skills ?? []).slice(0, 8);
  const uploadedAt = profileResponse?.created_at ?? null;

  // Work history — first 3 from rawProfile
  const workHistory = rawProfile?.work_history?.slice(0, 3) ?? [];

  // Education — first entry
  const education = rawProfile?.education?.[0] ?? null;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-5 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold text-foreground">{name}</h2>
            {headline && (
              <p className="text-sm text-muted-foreground mt-0.5">{headline}</p>
            )}
          </div>
          {yearsExp !== null && (
            <div className="shrink-0 flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm font-medium text-foreground">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              {yearsExp} yr{yearsExp !== 1 ? "s" : ""} exp.
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Top skills */}
        {skills.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Top Skills
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                >
                  {skill}
                </Badge>
              ))}
              {(profile?.verified_skills?.length ?? rawProfile?.skills?.length ?? 0) > 8 && (
                <Badge variant="secondary" className="text-muted-foreground">
                  +{(profile?.verified_skills?.length ?? rawProfile?.skills?.length ?? 0) - 8} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Recent Work History */}
        {workHistory.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Experience
              </h3>
            </div>
            <ul className="space-y-3">
              {workHistory.map((job, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">{job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {job.company} &middot; {formatDate(job.start_date)} –{" "}
                    {formatDate(job.end_date)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Education */}
        {education && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Education
              </h3>
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{education.degree}</p>
              <p className="text-xs text-muted-foreground">
                {education.institution}
                {education.year ? ` · ${education.year}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Resume uploaded info */}
        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            Resume last updated {formatUploadDate(uploadedAt)}
          </div>
          
          <div>
            <input
              ref={resumeInputRef}
              type="file"
              accept=".pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleResumeUpload}
              aria-label="Update Resume"
            />
            <button
              onClick={() => resumeInputRef.current?.click()}
              disabled={isUploadingResume}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50 transition-colors"
            >
              {isUploadingResume ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Update Resume
                </>
              )}
            </button>
          </div>
        </div>
        {resumeError && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-sm font-medium leading-tight">
              {resumeError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
