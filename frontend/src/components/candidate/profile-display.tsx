"use client";

import {
  useCandidateProfile,
  useCandidateNormalizedProfile,
  useUploadGithub,
} from "@/hooks/use-candidate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Briefcase, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

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

/**
 * ProfileDisplay — shows the profile details card and social integration cards.
 * This component is only rendered AFTER a resume has been uploaded.
 * For the empty/onboarding state, see OnboardingHero.
 */
export function ProfileDisplay() {
  const { data: profileResponse, isLoading: isLoadingRaw } = useCandidateProfile();
  const { data: normalizedResponse, isLoading: isLoadingNormalized } = useCandidateNormalizedProfile();
  const { mutate: addGithub, isPending: isGithubPending } = useUploadGithub();

  const [githubUsername, setGithubUsername] = useState("");
  const [githubError, setGithubError] = useState("");
  const [githubSuccess, setGithubSuccess] = useState(false);

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

  // Show nothing here if there's no data — parent page handles empty state
  if (!profile && !rawProfile) {
    return null;
  }

  const handleAddGithub = (e: React.FormEvent) => {
    e.preventDefault();
    setGithubError("");
    setGithubSuccess(false);
    if (!githubUsername.trim()) return;

    addGithub(githubUsername, {
      onSuccess: () => {
        setGithubUsername("");
        setGithubSuccess(true);
      },
      onError: (err: unknown) => {
        const axiosError = err as { response?: { data?: { detail?: string } } };
        setGithubError(
          axiosError?.response?.data?.detail ?? "Failed to link GitHub profile"
        );
      },
    });
  };

  return (
    <div className="space-y-4">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <GithubIcon className="w-4 h-4" />
            GitHub Integration
          </CardTitle>
          <CardDescription className="text-xs">
            Link your GitHub account to verify technical skills and open-source contributions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileResponse?.github_profile ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-white border border-border shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={profileResponse.github_profile.avatar_url}
                  alt={`${profileResponse.github_profile.login} GitHub avatar`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                    @{profileResponse.github_profile.login}
                  </p>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {profileResponse.github_profile.public_repos} public repositories verified
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddGithub} className="space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-1.5">
                  <Input
                    id="github-username-input"
                    placeholder="GitHub username or profile URL"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    disabled={isGithubPending}
                    aria-label="GitHub username"
                    autoComplete="off"
                  />
                  {githubError && (
                    <p className="text-xs font-medium text-destructive flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {githubError}
                    </p>
                  )}
                  {githubSuccess && (
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      GitHub connected successfully!
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isGithubPending || !githubUsername.trim()}
                >
                  {isGithubPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Connect"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* LinkedIn Integration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <LinkedinIcon className="w-4 h-4 text-[#0077B5]" />
            LinkedIn Integration
          </CardTitle>
          <CardDescription className="text-xs">
            Upload your LinkedIn profile PDF to cross-reference your work history and certifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileResponse?.linkedin_profile ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100">
                  LinkedIn profile connected
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {profileResponse.linkedin_profile.headline ?? "Professional profile verified"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Export your LinkedIn profile as a PDF and upload it here. Go to your LinkedIn
                profile → More → Save to PDF.
              </p>
              <label
                htmlFor="linkedin-profile-upload"
                className="flex items-center justify-center gap-2 w-full rounded-lg border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground hover:border-blue-400 hover:text-foreground hover:bg-muted/60 cursor-pointer transition-colors"
              >
                <LinkedinIcon className="h-4 w-4 text-[#0077B5]" />
                Upload LinkedIn PDF
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
