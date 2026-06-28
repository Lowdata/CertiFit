"use client";

import { useState } from "react";
import { useJobs, useJob, useApplyToJob } from "@/hooks/useJobs";
import { Job } from "@/types/job";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Building2, Calendar, Briefcase, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CandidateJobsPage() {
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: jobsData, isLoading, isError } = useJobs({
    page,
    page_size: pageSize,
    title: searchTitle || undefined,
    company: searchCompany || undefined,
  });

  const handleNextPage = () => {
    if (jobsData && page * pageSize < jobsData.total) {
      setPage(p => p + 1);
    }
  };

  const handlePrevPage = () => {
    if (page > 1) {
      setPage(p => p - 1);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Find Jobs</h1>
        <p className="text-muted-foreground mt-2">Discover roles matched to your profile and apply with one click.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by job title..." 
            className="pl-9 bg-white dark:bg-slate-900 border-border" 
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by company..." 
            className="pl-9 bg-white dark:bg-slate-900 border-border"
            value={searchCompany}
            onChange={(e) => setSearchCompany(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-600 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-200 dark:border-red-800">
          <AlertCircle className="mx-auto h-8 w-8 mb-2" />
          <p>Failed to load jobs.</p>
        </div>
      ) : jobsData?.data.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-border">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No jobs found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobsData?.data.map((job) => (
              <Card 
                key={job.id} 
                className="flex flex-col hover:border-blue-500/50 hover:shadow-lg dark:hover:shadow-blue-900/20 transition-all cursor-pointer bg-white dark:bg-slate-900 group"
                onClick={() => setSelectedJob(job)}
              >
                <CardHeader>
                  <CardTitle className="line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{job.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 mt-1 font-medium text-slate-700 dark:text-slate-300">
                    <Building2 className="h-3.5 w-3.5" />
                    {job.company}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <Calendar className="h-3.5 w-3.5" />
                    Posted {formatDistanceToNow(new Date(job.created_at))} ago
                  </div>
                  {job.parsed_jd_json?.required_skills && (
                    <div className="flex flex-wrap gap-1.5">
                      {job.parsed_jd_json.required_skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-none">
                          {skill}
                        </Badge>
                      ))}
                      {job.parsed_jd_json.required_skills.length > 3 && (
                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 border-none text-slate-500">
                          +{job.parsed_jd_json.required_skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50">
                  <Button variant="ghost" className="w-full text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
          
          {/* Pagination */}
          {jobsData && jobsData.total > pageSize && (
            <div className="flex items-center justify-between mt-8 border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * pageSize, jobsData.total)}</span> of <span className="font-medium text-foreground">{jobsData.total}</span> jobs
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={page === 1}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={page * pageSize >= jobsData.total}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <JobDetailsModal 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  );
}

function JobDetailsModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { data: fullJob, isLoading: isLoadingFullJob } = useJob(job.id);
  const { mutate: apply, isPending: isApplying, isSuccess: hasApplied, isError: applyError, error: applyErrorObj } = useApplyToJob();

  const handleApply = () => {
    apply(job.id);
  };

  const jobToRender = fullJob || job;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border-border/50 bg-white dark:bg-slate-950" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-border/50 flex flex-row items-start justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <CardTitle className="text-2xl text-slate-900 dark:text-white">{job.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 mt-2 text-base font-medium text-slate-600 dark:text-slate-400">
              <Building2 className="h-4 w-4" />
              {job.company}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {applyError && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/50 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Could not apply</h4>
                <p className="text-sm mt-1 opacity-90">{(applyErrorObj as any)?.response?.data?.detail || "An unexpected error occurred."}</p>
              </div>
            </div>
          )}

          {hasApplied && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Application Submitted!</h4>
                <p className="text-sm mt-1 opacity-90">Your profile has been successfully matched and sent to the recruiter.</p>
              </div>
            </div>
          )}

          {isLoadingFullJob ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-8 w-1/4 mt-6" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {jobToRender.parsed_jd_json ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Seniority / Level</h3>
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-medium py-1 px-3">
                      {jobToRender.parsed_jd_json.seniority}
                    </Badge>
                  </div>
                  
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Required Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {jobToRender.parsed_jd_json.required_skills.map((skill, i) => (
                        <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-none font-medium py-1 px-3">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {jobToRender.parsed_jd_json.tech_stack.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">Tech Stack</h3>
                      <div className="flex flex-wrap gap-2">
                        {jobToRender.parsed_jd_json.tech_stack.map((tech, i) => (
                          <Badge key={i} variant="outline" className="text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 font-medium py-1 px-3">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              
              <div>
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 border-b border-border/50 pb-2">Job Description</h3>
                <div className="text-sm">
                  <FormattedJD text={jobToRender.raw_jd} />
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-border/50 p-5 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 justify-end gap-3 rounded-b-xl">
          <Button variant="outline" onClick={onClose} className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            Close
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] shadow-lg shadow-blue-600/20"
            onClick={() => {
              if (jobToRender.apply_type === "external" && jobToRender.external_apply_url) {
                window.open(jobToRender.external_apply_url, "_blank");
                // Optionally could mark as applied in our system
              } else {
                handleApply();
              }
            }}
            disabled={(isApplying || hasApplied) && jobToRender.apply_type !== "external"}
          >
            {jobToRender.apply_type === "external" ? (
              <><Briefcase className="mr-2 h-4 w-4" /> Apply Externally</>
            ) : isApplying ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Applying...</>
            ) : hasApplied ? (
              <><CheckCircle2 className="mr-2 h-4 w-4" /> Applied</>
            ) : (
              "One-Click Apply"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function FormattedJD({ text }: { text: string }) {
  if (!text) return null;
  
  // Split by common JD headers to add structure to dense text
  const parts = text.split(/(About Us:|Role:|Responsibilities:|Requirements:|Qualifications:|Nice To Have:|Benefits:|What You'll Do:|Who You Are:|What We're Looking For:|Why Join Us:)/gi);
  
  return (
    <div className="space-y-3 text-[14.5px] leading-relaxed text-slate-700 dark:text-slate-300">
      {parts.map((part, i) => {
        if (!part.trim()) return null;
        
        if (/(About Us:|Role:|Responsibilities:|Requirements:|Qualifications:|Nice To Have:|Benefits:|What You'll Do:|Who You Are:|What We're Looking For:|Why Join Us:)/i.test(part)) {
          return (
            <h4 key={i} className="font-bold text-slate-900 dark:text-white mt-6 mb-1 text-base tracking-tight">
              {part.replace(/:$/, '')}
            </h4>
          );
        }
        
        // Handle inner bullet points if they exist (dash or dot)
        const lines = part.split('\n');
        return (
          <div key={i} className="space-y-2">
            {lines.map((line, j) => {
              if (!line.trim()) return null;
              if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                return (
                  <div key={j} className="flex gap-2 ml-1">
                    <span className="text-slate-400">•</span>
                    <span>{line.trim().substring(2)}</span>
                  </div>
                );
              }
              return <p key={j}>{line.trim()}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
