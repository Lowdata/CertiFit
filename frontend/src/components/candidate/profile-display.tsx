"use client";

import { useCandidateProfile, useCandidateNormalizedProfile, useUploadGithub } from "@/hooks/use-candidate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Briefcase, FileText, Loader2, AlertCircle } from "lucide-react";

const Github = ({ className }: { className?: string }) => (
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

export function ProfileDisplay() {
  const { data: profileResponse, isLoading: isLoadingRaw } = useCandidateProfile();
  const { data: normalizedResponse, isLoading: isLoadingNormalized } = useCandidateNormalizedProfile();
  const { mutate: addGithub, isPending: isGithubPending } = useUploadGithub();
  
  const [githubUsername, setGithubUsername] = useState("");
  const [githubError, setGithubError] = useState("");

  if (isLoadingRaw || isLoadingNormalized) {
    return (
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
    );
  }

  const profile = normalizedResponse?.normalized_profile;
  const rawProfile = profileResponse?.parsed_candidate;

  if (!profile && !rawProfile) {
    return (
      <Card className="border-dashed border-2 bg-slate-50/50 dark:bg-slate-900/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-slate-400 mb-4" />
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100">No Profile Data Yet</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Upload your resume above to automatically generate your candidate profile.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAddGithub = (e: React.FormEvent) => {
    e.preventDefault();
    setGithubError("");
    if (!githubUsername.trim()) return;
    
    addGithub(githubUsername, {
      onSuccess: () => {
        setGithubUsername("");
      },
      onError: (err: any) => {
        setGithubError(err?.response?.data?.detail || "Failed to link GitHub profile");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Base Profile Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{profile?.name || rawProfile?.name || "Candidate Profile"}</CardTitle>
          <CardDescription className="text-base">{profile?.headline || rawProfile?.current_role || "No headline available"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Experience</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {profile?.years_experience !== undefined ? `${profile.years_experience} years` : "Unknown"}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              Verified Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {(profile?.verified_skills || rawProfile?.skills || []).map((skill: string, i: number) => (
                <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50">
                  {skill}
                </Badge>
              ))}
              {(!profile?.verified_skills?.length && !rawProfile?.skills?.length) && (
                <span className="text-sm text-slate-500 italic">No skills detected yet.</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Github className="w-5 h-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>Link your GitHub account to verify technical skills and open source contributions.</CardDescription>
        </CardHeader>
        <CardContent>
          {profileResponse?.github_profile ? (
            <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profileResponse.github_profile.avatar_url} alt="GitHub Avatar" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Linked as {profileResponse.github_profile.login}</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">Successfully verified {profileResponse.github_profile.public_repos} public repositories.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAddGithub} className="flex items-start gap-3">
              <div className="flex-1 space-y-2">
                <Input 
                  placeholder="Enter your GitHub username..." 
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  disabled={isGithubPending}
                />
                {githubError && (
                  <p className="text-sm font-medium text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {githubError}
                  </p>
                )}
              </div>
              <Button type="submit" disabled={isGithubPending || !githubUsername.trim()}>
                {isGithubPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Connect"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
