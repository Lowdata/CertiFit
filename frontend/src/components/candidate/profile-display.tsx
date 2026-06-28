"use client";

import {
  useCandidateProfile,
  useCandidateNormalizedProfile,
  useUploadGithub,
  useUploadLinkedin,
} from "@/hooks/use-candidate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef } from "react";
import { Briefcase, Loader2, AlertCircle, CheckCircle2, UploadCloud, Calendar, ShieldCheck, RefreshCw } from "lucide-react";

// Helpers
function isConnected(obj: Record<string, unknown> | null | undefined): boolean {
  return !!obj && Object.keys(obj).length > 0;
}

const GithubIcon = ({ className }: { className?: string }) => (
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
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

export function ProfileDisplay() {
  const { data: profileResponse, isLoading: isLoadingRaw } = useCandidateProfile();
  const { data: normalizedResponse, isLoading: isLoadingNormalized } = useCandidateNormalizedProfile();
  const { mutate: addGithub, isPending: isGithubPending } = useUploadGithub();
  const { mutate: uploadLinkedin, isPending: isLinkedinPending } = useUploadLinkedin();

  const [githubUsername, setGithubUsername] = useState("");
  const [githubError, setGithubError] = useState("");
  const linkedinInputRef = useRef<HTMLInputElement>(null);

  if (isLoadingRaw || isLoadingNormalized) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const profile = normalizedResponse?.normalized_profile;
  const rawProfile = profileResponse?.parsed_candidate;

  if (!profile && !rawProfile) {
    return null;
  }

  const handleAddGithub = (e: React.FormEvent) => {
    e.preventDefault();
    setGithubError("");
    if (!githubUsername.trim()) return;

    addGithub(githubUsername, {
      onSuccess: () => {
        setGithubUsername("");
      },
      onError: (err: unknown) => {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setGithubError(
          axiosError?.response?.data?.detail ?? "Failed to link GitHub profile"
        );
      },
    });
  };

  const handleRefreshGithub = () => {
    const username = githubData.username || githubData.profile?.login;
    if (username) {
      addGithub(username);
    }
  };

  const handleLinkedinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadLinkedin(file);
    if (linkedinInputRef.current) linkedinInputRef.current.value = "";
  };

  const hasGithub = isConnected(profileResponse?.github_profile);
  const githubData: any = profileResponse?.github_profile || {};
  
  const hasLinkedin = isConnected(profileResponse?.linkedin_profile);
  const linkedinData: any = profileResponse?.linkedin_profile || {};

  const lastActivityStr = githubData.recent_events?.[0]?.created_at 
    || githubData.repositories?.[0]?.pushed_at 
    || githubData.profile?.updated_at;
  const lastActivityDate = lastActivityStr ? new Date(lastActivityStr).toLocaleDateString() : "N/A";

  return (
    <div className="space-y-6">
      {/* Verified skills (from normalized profile) */}
      {((profile?.verified_skills?.length ?? 0) > 0 ||
        (rawProfile?.skills?.length ?? 0) > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Verified Skills
            </CardTitle>
            <CardDescription className="text-xs">
              Extracted and cross-referenced across your connected sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(profile?.verified_skills ?? rawProfile?.skills ?? []).map(
                (skill: string, i: number) => (
                  <Badge
                    key={i}
                    variant="secondary"
                    className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    {skill}
                  </Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GitHub Integration */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <GithubIcon className="w-5 h-5" />
              GitHub Verification
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Verify your technical claims using your public repositories.
            </CardDescription>
          </div>
          {hasGithub && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshGithub}
              disabled={isGithubPending}
              className="h-8 shrink-0"
              aria-label="Refresh GitHub Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isGithubPending ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          {hasGithub ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-white border border-border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={githubData.profile?.avatar_url || undefined}
                    alt={`${githubData.profile?.login || "User"} GitHub avatar`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                      GitHub Connected
                    </p>
                  </div>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                    @{githubData.profile?.login || githubData.username}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Repositories</p>
                  <p className="text-sm font-semibold">{githubData.profile?.public_repos || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Languages</p>
                  <p className="text-sm font-semibold">{Object.keys(githubData.language_totals || {}).length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Last activity</p>
                  <p className="text-sm font-semibold">
                    {lastActivityDate}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleAddGithub} className="space-y-4 max-w-sm">
                <div className="space-y-2">
                  <label htmlFor="github-username-input" className="text-sm font-medium text-foreground">
                    Username
                  </label>
                  <Input
                    id="github-username-input"
                    placeholder="e.g. torvalds"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    disabled={isGithubPending}
                    aria-label="GitHub username"
                    autoComplete="off"
                  />
                  {githubError && (
                    <p className="text-xs font-medium text-destructive flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {githubError}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={isGithubPending || !githubUsername.trim()}
                  className="w-full sm:w-auto"
                >
                  {isGithubPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    "Connect GitHub"
                  )}
                </Button>
              </form>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Benefits</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Verify technical skills</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Validate projects</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Improve recruiter confidence</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Better interview questions</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* LinkedIn Integration */}
      <Card>
        <CardHeader className="pb-3 border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/50 flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <LinkedinIcon className="w-5 h-5 text-[#0077B5]" />
              LinkedIn Verification
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Upload your exported LinkedIn Profile PDF to cross-reference your history.
            </CardDescription>
          </div>
          {hasLinkedin && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => linkedinInputRef.current?.click()}
              disabled={isLinkedinPending}
              className="h-8 shrink-0"
              aria-label="Update LinkedIn PDF"
            >
              {isLinkedinPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  Update PDF
                </>
              )}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-6">
          <input
            ref={linkedinInputRef}
            id="linkedin-pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleLinkedinFileChange}
          />
          {hasLinkedin ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">
                    LinkedIn Connected
                  </p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {linkedinData.headline || "Professional profile verified"}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground mb-1">Current Role</p>
                  <p className="text-sm font-semibold line-clamp-1">
                    {linkedinData.positions?.[0]?.title || "N/A"} 
                    {linkedinData.positions?.[0]?.company ? ` at ${linkedinData.positions[0].company}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Career Timeline</p>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Verified
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Education/Certs</p>
                  <p className="text-sm font-semibold">
                    {(linkedinData.education || []).length} / {(linkedinData.certifications || []).length}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="max-w-sm">
                <Button 
                  variant="outline" 
                  className="w-full h-auto py-4 flex flex-col gap-2 items-center justify-center border-dashed border-2 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20"
                  onClick={() => linkedinInputRef.current?.click()}
                  disabled={isLinkedinPending}
                >
                  {isLinkedinPending ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="text-sm font-medium">Uploading PDF...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Choose File</span>
                      <span className="text-xs text-muted-foreground font-normal">Supported: LinkedIn PDF Export</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Benefits</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Employment verification</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Timeline verification</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Education verification</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
