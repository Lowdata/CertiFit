"use client";

import { useMyApplications } from "@/hooks/useApplications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Building2, Calendar, Clock, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useJobs } from "@/hooks/useJobs";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CandidateApplicationsPage() {
  const { data: applications, isLoading, isError } = useMyApplications();

  // We might want to fetch job details for each application to show job title and company.
  // We can just fetch the list of all jobs without pagination to map them, 
  // or we can rely on the backend returning job_title/company inside the application payload.
  // Currently, the backend returns job_id but not the job details inside /applications/me.
  // Wait, let's fetch jobs data to match them up, or just display the Application details.
  // To keep it simple and fast, we'll fetch jobs and map them.
  const { data: jobsData } = useJobs({ page_size: 100 });
  const router = useRouter();

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Applications</h1>
        <p className="text-muted-foreground mt-2">Track the status of roles you have applied for.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-4">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Failed to load applications.</p>
        </div>
      ) : applications?.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-border">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No applications yet</h3>
          <p className="text-muted-foreground">Head over to the Jobs section to find and apply for roles.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications?.map((app) => {
            const matchedJob = jobsData?.data.find(j => j.id === app.job_id);
            
            return (
              <Card key={app.id} className="bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {matchedJob ? matchedJob.title : `Job #${app.job_id}`}
                      </CardTitle>
                      {matchedJob && (
                        <CardDescription className="flex items-center gap-1.5 mt-2 font-medium text-slate-700 dark:text-slate-300">
                          <Building2 className="h-4 w-4" />
                          {matchedJob.company}
                        </CardDescription>
                      )}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        app.status === "applied" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" :
                        app.status === "shortlisted" ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" :
                        app.status === "rejected" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" :
                        app.status === "hired" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" :
                        "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                      }
                    >
                      {app.status.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Applied {formatDistanceToNow(new Date(app.applied_at))} ago
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last updated {formatDistanceToNow(new Date(app.updated_at))} ago
                    </span>
                  </div>
                  
                  {app.match_score !== null && (
                    <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Match Score</div>
                        <Badge variant="secondary" className="font-mono">{app.match_score}%</Badge>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {app.match_summary || "Analyzing your profile..."}
                      </p>
                    </div>
                  )}

                  {/* Visual Timeline */}
                  <div className="mt-8 pt-6 border-t border-border">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full" />
                      
                      {/* Step 1: Applied */}
                      <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2">
                        <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                        <span className="text-xs font-semibold">Applied</span>
                      </div>
                      
                      {/* Step 2: AI Screening */}
                      <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2">
                        {app.match_score !== null ? (
                          <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                        ) : app.status === "rejected" ? (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                        )}
                        <span className="text-xs font-semibold text-center">
                          AI Screening
                        </span>
                      </div>
                      
                      {/* Step 3: Interview */}
                      <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2">
                        {app.status === "shortlisted" || app.status === "hired" ? (
                          <CheckCircle2 className="w-6 h-6 text-primary fill-primary/20" />
                        ) : app.status === "rejected" ? (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-center">
                          Interview
                        </span>
                      </div>
                      
                      {/* Step 4: Decision */}
                      <div className="flex flex-col items-center gap-2 bg-white dark:bg-slate-900 px-2">
                        {app.status === "hired" ? (
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-500/20" />
                        ) : app.status === "rejected" ? (
                          <AlertCircle className="w-6 h-6 text-red-500 fill-red-500/20" />
                        ) : (
                          <Circle className="w-6 h-6 text-muted-foreground" />
                        )}
                        <span className="text-xs font-semibold text-center">
                          {app.status === "rejected" ? "Rejected" : "Offer"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    {(app.status === "rejected" || app.status === "hired") && (
                      <Button 
                        onClick={() => router.push(`/candidate/applications/${app.id}/report`)}
                        variant="outline"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Feedback
                      </Button>
                    )}
                    {app.status !== "rejected" && app.status !== "hired" && (
                      <Button 
                        onClick={() => router.push(`/candidate/applications/${app.id}/assessment/lobby`)}
                        variant="default"
                      >
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Take Assessment
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
