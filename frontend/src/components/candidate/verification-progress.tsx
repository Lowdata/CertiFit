"use client";

import { CheckCircle2, Circle, FileText, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCallback, useRef } from "react";
import { useUploadLinkedin } from "@/hooks/use-candidate";
import type { CandidateProfileResponse } from "@/lib/candidate-api";

// ─── helpers ────────────────────────────────────────────────────────────────

/** An empty object `{}` from the backend means "not connected" */
function isConnected(obj: Record<string, unknown> | null | undefined): boolean {
  return !!obj && Object.keys(obj).length > 0;
}

function pluralise(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// ─── sub-stats for each source ───────────────────────────────────────────────

function ResumeStats({ profile }: { profile: CandidateProfileResponse }) {
  const p = profile.parsed_candidate;
  if (!p) return null;

  const skills = (p.skills ?? []).length;
  const companies = (p.work_history ?? []).length;
  const degrees = (p.education ?? []).length;

  return (
    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
      {skills > 0 && <li>✦ {pluralise(skills, "skill")} extracted</li>}
      {companies > 0 && <li>✦ {pluralise(companies, "company")} found</li>}
      {degrees > 0 && <li>✦ {pluralise(degrees, "degree")} found</li>}
    </ul>
  );
}

function GithubStats({ github }: { github: Record<string, any> }) {
  if (!github || !isConnected(github)) return null;

  const repos = github.profile?.public_repos ?? 0;
  const languages = Object.keys(github.language_totals ?? {}).length;
  const login = github.username ?? github.profile?.login ?? "";

  return (
    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
      {login && <li>✦ @{login}</li>}
      {repos > 0 && <li>✦ {pluralise(repos, "repository")}</li>}
      {languages > 0 && <li>✦ {pluralise(languages, "language")}</li>}
    </ul>
  );
}

function LinkedinStats({ linkedin }: { linkedin: Record<string, any> }) {
  if (!linkedin || !isConnected(linkedin)) return null;

  const positions = (linkedin.positions ?? []).length;
  const education = (linkedin.education ?? []).length;
  const certs = (linkedin.certifications ?? []).length;

  return (
    <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
      {positions > 0 && <li>✦ {pluralise(positions, "position")} verified</li>}
      {education > 0 && <li>✦ {pluralise(education, "degree")} verified</li>}
      {certs > 0 && <li>✦ {pluralise(certs, "certification")}</li>}
    </ul>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

interface VerificationProgressProps {
  profile: CandidateProfileResponse | undefined;
  onConnectGithub?: () => void;
}

export function VerificationProgress({
  profile,
  onConnectGithub,
}: VerificationProgressProps) {
  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadLinkedin, isPending: isLinkedinUploading } = useUploadLinkedin();

  const handleLinkedinUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      uploadLinkedin(file);
      if (linkedinInputRef.current) linkedinInputRef.current.value = "";
    },
    [uploadLinkedin]
  );

  const hasResume = !!profile?.parsed_candidate;
  const hasGithub = isConnected(profile?.github_profile as Record<string, unknown> | null);
  const hasLinkedin = isConnected(profile?.linkedin_profile as Record<string, unknown> | null);

  const connected = Number(hasResume) + Number(hasGithub) + Number(hasLinkedin);
  const total = 3;
  const percent = Math.round((connected / total) * 100);

  const strengthLabel =
    percent === 100 ? "Verified Candidate" :
    percent >= 66 ? "Strong" :
    percent >= 33 ? "In Progress" :
    "Getting Started";

  const strengthColor =
    percent === 100 ? "text-emerald-600 dark:text-emerald-400" :
    percent >= 66 ? "text-blue-600 dark:text-blue-400" :
    percent >= 33 ? "text-amber-600 dark:text-amber-400" :
    "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Verification Progress</h3>
          <span className={`text-sm font-semibold ${strengthColor}`}>
            {strengthLabel}
          </span>
        </div>
        <Progress value={percent} className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800" />
        <p className="text-xs text-muted-foreground mt-2">
          {connected} of {total} sources verified
        </p>
      </div>

      {/* Checklist */}
      <ul className="divide-y divide-border">

        {/* Resume */}
        <li className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {hasResume
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <Circle className="h-4 w-4 text-muted-foreground/40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${hasResume ? "text-foreground" : "text-muted-foreground"}`}>
                Resume
              </p>
              {hasResume
                ? <ResumeStats profile={profile!} />
                : <p className="text-xs text-muted-foreground mt-0.5">Not uploaded yet</p>}
            </div>
            {hasResume && (
              <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Parsed
              </span>
            )}
          </div>
        </li>

        {/* GitHub */}
        <li className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {hasGithub
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <Circle className="h-4 w-4 text-muted-foreground/40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${hasGithub ? "text-foreground" : "text-muted-foreground"}`}>
                GitHub
              </p>
              {hasGithub
                ? <GithubStats github={profile!.github_profile!} />
                : <p className="text-xs text-muted-foreground mt-0.5">Connect to verify technical skills</p>}
            </div>
            {!hasGithub && hasResume && (
              <Button
                size="sm"
                variant="outline"
                onClick={onConnectGithub}
                className="shrink-0 text-xs h-7 px-2.5"
              >
                Connect
              </Button>
            )}
            {hasGithub && (
              <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Verified
              </span>
            )}
          </div>
        </li>

        {/* LinkedIn */}
        <li className="px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 shrink-0">
              {hasLinkedin
                ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                : <Circle className="h-4 w-4 text-muted-foreground/40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${hasLinkedin ? "text-foreground" : "text-muted-foreground"}`}>
                LinkedIn
              </p>
              {hasLinkedin
                ? <LinkedinStats linkedin={profile!.linkedin_profile!} />
                : <p className="text-xs text-muted-foreground mt-0.5">Upload LinkedIn PDF to verify career</p>}
            </div>
            {!hasLinkedin && hasResume && (
              <>
                <input
                  ref={linkedinInputRef}
                  id="linkedin-pdf-verify-input"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleLinkedinUpload}
                  aria-label="Upload LinkedIn PDF"
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLinkedinUploading}
                  onClick={() => linkedinInputRef.current?.click()}
                  className="shrink-0 text-xs h-7 px-2.5 whitespace-nowrap"
                >
                  {isLinkedinUploading && (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  )}
                  {isLinkedinUploading ? "Uploading…" : "Upload PDF"}
                </Button>
              </>
            )}
            {hasLinkedin && (
              <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Verified
              </span>
            )}
          </div>
        </li>
      </ul>

      {/* Estimated improvement footer */}
      {connected < total && (
        <div className="px-5 py-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <FileText className="h-3 w-3 shrink-0" />
            {connected === 0
              ? "Upload a resume to begin verification"
              : connected === 1
              ? "Connect GitHub or LinkedIn for +67% stronger verification"
              : "Connect one more source for 100% verified status"}
          </p>
        </div>
      )}

      {/* 100% complete banner */}
      {percent === 100 && (
        <div className="px-5 py-3 border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 text-center">
            🎉 Fully Verified Candidate
          </p>
        </div>
      )}
    </div>
  );
}
