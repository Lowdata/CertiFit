"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Briefcase, TrendingUp, Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface DashboardStats {
  active_jobs: number;
  total_applications: number;
  recent_applications: Array<{
    id: number;
    candidate_name: string;
    job_title: string;
    status: string;
    created_at: string;
    trust_score: number | null;
  }>;
}

export default function RecruiterDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get("/analytics/dashboard");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto py-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Recruiter Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview of your active jobs and recent candidates.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/recruiter/company">
            <Button variant="outline" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Company Profile
            </Button>
          </Link>
          <Link href="/recruiter/jobs/new">
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" /> Post Job
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" /> Active Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {stats?.active_jobs || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Currently accepting applications
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-500" /> Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              {stats?.total_applications || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Across all your job postings
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Hire Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-50">
              24%
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              +4% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Recent Applications</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Latest candidates who applied to your jobs</p>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recent_applications && stats.recent_applications.length > 0 ? (
                <div className="space-y-4">
                  {stats.recent_applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                      <div className="flex flex-col gap-1">
                        <Link href={`/recruiter/jobs/${app.id}/applications`} className="font-semibold text-slate-900 dark:text-slate-50 hover:text-blue-600 transition-colors">
                          {app.candidate_name}
                        </Link>
                        <span className="text-sm text-slate-500">Applied for <span className="font-medium text-slate-700 dark:text-slate-300">{app.job_title}</span></span>
                        <span className="text-xs text-slate-400">{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        {app.trust_score ? (
                          <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                            Trust: {app.trust_score}%
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            No Score
                          </div>
                        )}
                        <span className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
                          {app.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50">No applications yet</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">When candidates apply to your jobs, they'll appear here.</p>
                  <Link href="/recruiter/jobs/new">
                    <Button variant="outline">Post a New Job</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
                  <TrendingUp className="h-4 w-4" />
                </span>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/recruiter/candidates/compare" className="block">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Compare Candidates</h4>
                  <p className="text-xs text-slate-500 mt-1">Use AI to compare candidates side-by-side.</p>
                </div>
              </Link>
              
              <Link href="/recruiter/jobs" className="block">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage Jobs</h4>
                  <p className="text-xs text-slate-500 mt-1">View, edit, or close your active job postings.</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
