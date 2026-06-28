"use client";

import { useRef } from "react";
import { useCandidateProfile } from "@/hooks/use-candidate";
import { useAuthStore } from "@/store/authStore";
import { OnboardingHero } from "@/components/candidate/onboarding-hero";
import { CandidateOverview } from "@/components/candidate/candidate-overview";
import { ProfileCompleteness } from "@/components/candidate/profile-completeness";
import { ProfileDisplay } from "@/components/candidate/profile-display";
import { Skeleton } from "@/components/ui/skeleton";

export default function CandidateProfilePage() {
  const { data: profileResponse, isLoading } = useCandidateProfile();
  const { user } = useAuthStore();

  // Ref for scrolling to GitHub connect form when "Connect" is clicked in completeness card
  const githubSectionRef = useRef<HTMLDivElement>(null);

  const hasResume = !!profileResponse?.parsed_candidate;
  const hasGithub = !!profileResponse?.github_profile;
  const hasLinkedin = !!profileResponse?.linkedin_profile;

  const handleConnectGithub = () => {
    githubSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // Also focus the input inside the profile-display section
    const input = githubSectionRef.current?.querySelector<HTMLInputElement>("#github-username-input");
    setTimeout(() => input?.focus(), 400);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-12 w-full mt-4" />
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      {/* ── ONBOARDING STATE: no resume yet ── */}
      {!hasResume && (
        <>
          <OnboardingHero userName={user?.name} />
          <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-12">
            {/* Empty state detail card */}
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-7 w-7 text-muted-foreground"
                  aria-hidden="true"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M9 13h6M9 17h3" />
                  <circle cx="17" cy="17" r="3" />
                  <path d="m21 21-1.5-1.5" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Your AI profile hasn&apos;t been created yet.
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Upload your resume above to begin building your verified candidate profile.
                CertiFit will automatically extract your experience, skills, projects, and
                career timeline.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── PROFILE EXISTS STATE ── */}
      {hasResume && (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Profile
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your verified candidate profile and connected sources.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-6">
              <CandidateOverview />
              <div ref={githubSectionRef}>
                <ProfileDisplay />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <ProfileCompleteness
                  hasResume={hasResume}
                  hasGithub={hasGithub}
                  hasLinkedin={hasLinkedin}
                  onConnectGithub={handleConnectGithub}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
