"use client";

import Link from "next/link";
import { useRecruiterJobs } from "@/hooks/useRecruiter";
import { useAuthStore } from "@/store/authStore";
import {
  Briefcase,
  Plus,
  ArrowRight,
  Users,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function RecruiterDashboardPage() {
  const { user } = useAuthStore();
  const { data: jobsData, isLoading } = useRecruiterJobs({ page: 1, page_size: 5 });

  const firstName = user?.name?.split(" ")[0] ?? "Recruiter";
  const totalJobs = jobsData?.total ?? 0;
  const recentJobs = jobsData?.data ?? [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-lg">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/5 blur-xl" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-2 text-blue-100 max-w-lg">
            Manage your job listings, review candidates with AI-powered
            insights, and make smarter hiring decisions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/recruiter/jobs/new">
              <Button className="bg-white text-blue-700 hover:bg-blue-50 font-semibold gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Post a New Job
              </Button>
            </Link>
            <Link href="/recruiter/jobs">
              <Button
                variant="outline"
                className="border-white/30 text-white hover:bg-white/10 gap-2"
              >
                <Briefcase className="h-4 w-4" />
                View All Jobs
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
              <Briefcase className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
              <p className="text-2xl font-bold text-foreground">
                {isLoading ? "—" : totalJobs}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
              <Users className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">AI-Powered</p>
              <p className="text-2xl font-bold text-foreground">Screening</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/40">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trust Verified</p>
              <p className="text-2xl font-bold text-foreground">Candidates</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Jobs */}
      <Card className="bg-white dark:bg-slate-900 border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Jobs
          </CardTitle>
          <Link href="/recruiter/jobs">
            <Button variant="ghost" size="sm" className="gap-1 text-blue-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Briefcase className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground">
                No jobs posted yet. Create your first job listing to start
                receiving AI-screened candidates!
              </p>
              <Link href="/recruiter/jobs/new">
                <Button className="mt-2 gap-2">
                  <Plus className="h-4 w-4" /> Post a Job
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/recruiter/jobs/${job.id}`}
                  className="flex items-center justify-between py-4 px-2 hover:bg-muted/50 rounded-lg transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground truncate group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{job.company}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
