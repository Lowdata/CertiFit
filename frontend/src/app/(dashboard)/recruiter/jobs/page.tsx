"use client";

import { useState } from "react";
import Link from "next/link";
import { useRecruiterJobs, useDeleteRecruiterJob } from "@/hooks/useRecruiter";
import {
  Plus,
  Briefcase,
  Trash2,
  ArrowRight,
  Loader2,
  Search,
  Calendar,
  Building2,
  Activity,
  PauseCircle,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function RecruiterJobsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useRecruiterJobs({ page, page_size: 10 });
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteRecruiterJob();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const jobs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 10);

  const filteredJobs = search
    ? jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(search.toLowerCase()) ||
          j.company.toLowerCase().includes(search.toLowerCase())
      )
    : jobs;

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to close this job? It will no longer accept applications.")) return;
    setDeletingId(id);
    deleteJob(id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            My Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            {total} job{total !== 1 ? "s" : ""} posted
          </p>
        </div>
        <Link href="/recruiter/jobs/new">
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 bg-white dark:bg-slate-900 border-border"
        />
      </div>

      {/* Jobs list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              {search ? "No matching jobs" : "No jobs yet"}
            </h3>
            <p className="text-muted-foreground max-w-sm">
              {search
                ? "Try adjusting your search terms."
                : "Post your first job to start receiving AI-screened applications."}
            </p>
            {!search && (
              <Link href="/recruiter/jobs/new" className="mt-4">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> Post a Job
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredJobs.map((job) => (
            <Link key={job.id} href={`/recruiter/jobs/${job.id}`}>
              <Card className="bg-white dark:bg-slate-900 border-border hover:border-blue-300 dark:hover:border-blue-800 hover:shadow-md transition-all duration-200 group cursor-pointer">
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40 shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center">
                        <h3 className="font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        {job.status && (
                          <span className={`ml-3 px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wider shrink-0 ${
                            job.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                            job.status === "paused" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                            "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {job.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(job.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={(e) => handleDelete(job.id, e)}
                      disabled={deletingId === job.id}
                    >
                      {deletingId === job.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
