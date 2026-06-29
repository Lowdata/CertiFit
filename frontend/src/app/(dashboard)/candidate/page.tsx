"use client";

import { useAuthStore } from "@/store/authStore";
import { useMyApplications } from "@/hooks/useApplications";
import { useCandidateProfile } from "@/hooks/use-candidate";
import { useJobs } from "@/hooks/useJobs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Building2, Calendar, Briefcase, ArrowRight, Activity, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function CandidateDashboard() {
  const { user } = useAuthStore();
  const { data: profileResponse, isLoading: profileLoading } = useCandidateProfile();
  const { data: applications, isLoading: appsLoading } = useMyApplications();
  
  // Just fetching a few jobs to show in a "Discover" section
  const { data: jobsResponse, isLoading: jobsLoading } = useJobs({ page_size: 4 });

  // Calculate profile completeness
  const profile = profileResponse?.parsed_candidate;
  let completeness = 0;
  if (profile) completeness += 25; // Resume
  if (profileResponse?.github_profile) completeness += 25;
  if (profileResponse?.linkedin_profile) completeness += 25;
  if (profile?.skills && profile.skills.length > 0) completeness += 25;

  const recentApps = applications?.slice(0, 3) || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name || "Candidate"}!
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's an overview of your job search progress and profile status.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/candidate/profile">
            <Button variant="outline">View Profile</Button>
          </Link>
          <Link href="/candidate/jobs">
            <Button>Find Jobs</Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Applications</CardTitle>
            <FileText className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{appsLoading ? <Skeleton className="h-8 w-12" /> : applications?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Roles you've applied for</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trust Score</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {profileLoading ? <Skeleton className="h-8 w-16" /> : (profileResponse?.trust_score ? `${profileResponse.trust_score}%` : "N/A")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Based on verified history</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profile Completeness</CardTitle>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profileLoading ? <Skeleton className="h-8 w-16" /> : `${completeness}%`}</div>
            {completeness === 100 ? (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> All-Star Profile
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Connect more sources
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Next Step</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold leading-tight">
              {completeness < 100 ? "Complete your profile to increase your match scores." : "You're ready! Start applying to top roles."}
            </div>
            <Link href={completeness < 100 ? "/candidate/profile" : "/candidate/jobs"}>
              <Button variant="secondary" size="sm" className="mt-4 w-full bg-white text-blue-700 hover:bg-blue-50 border-0">
                {completeness < 100 ? "Update Profile" : "Browse Jobs"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Applications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Recent Activity</h2>
            <Link href="/candidate/applications">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            {appsLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
            ) : recentApps.length === 0 ? (
              <Card className="border-dashed bg-slate-50 dark:bg-slate-900/50">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                  <FileText className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No applications yet</p>
                  <Link href="/candidate/jobs">
                    <Button variant="link" className="mt-1 text-blue-600">Find your first role</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              recentApps.map((app) => {
                const matchedJob = jobsResponse?.data.find(j => j.id === app.job_id);
                return (
                  <Card key={app.id} className="bg-white dark:bg-slate-900 overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="p-5 pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg leading-tight">
                            {matchedJob ? matchedJob.title : `Job #${app.job_id}`}
                          </CardTitle>
                          {matchedJob && (
                            <CardDescription className="flex items-center gap-1.5 mt-1.5 text-slate-600">
                              <Building2 className="h-3.5 w-3.5" />
                              {matchedJob.company}
                            </CardDescription>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={
                            app.status === "applied" ? "bg-amber-50 text-amber-700 border-amber-200" :
                            app.status === "shortlisted" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            app.status === "rejected" ? "bg-red-50 text-red-700 border-red-200" :
                            app.status === "hired" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            "bg-slate-50 text-slate-700 border-slate-200"
                          }
                        >
                          {app.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 pt-0">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDistanceToNow(new Date(app.applied_at))} ago
                        </span>
                        {app.match_score !== null && (
                          <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            Score: {app.match_score}%
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Suggested Jobs */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Discover Roles</h2>
            <Link href="/candidate/jobs">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                Search <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid gap-4">
            {jobsLoading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : jobsResponse?.data.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No new jobs available right now.</p>
            ) : (
              jobsResponse?.data.slice(0, 4).map((job) => (
                <Link key={job.id} href="/candidate/jobs">
                  <div className="group flex items-center justify-between p-4 rounded-xl border border-border bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company}
                        </span>
                      </div>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
