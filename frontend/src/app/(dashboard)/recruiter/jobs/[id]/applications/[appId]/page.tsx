"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCandidateReport, useGenerateInterviewPlan } from "@/hooks/useRecruiter";
import {
  ArrowLeft,
  Loader2,
  Star,
  Shield,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  MessageSquare,
  Target,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AssessmentReview } from "@/components/AssessmentReview";

function ScoreGauge({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-bold text-foreground">{Math.round(value)}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function CandidateReportPage() {
  const params = useParams();
  const jobId = Number(params.id);
  const appId = Number(params.appId);
  const { data: report, isLoading } = useCandidateReport(appId);
  const { mutate: genPlan, isPending: planLoading, data: planData } = useGenerateInterviewPlan();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Report not found.</p>
      </div>
    );
  }

  const interviewPlan = (planData?.interview_plan ?? report.interview_plan) as Record<string, unknown[]>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Link
        href={`/recruiter/jobs/${jobId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applicants
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Candidate Intelligence Report
        </h1>
        <p className="text-muted-foreground mt-1">
          Application #{report.application_id} · Comprehensive AI analysis
        </p>
      </div>

      {/* Recommendation Section */}
      {!!report.score_explanations?.recommendation && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-100 dark:border-blue-900 mb-6">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  AI Recommendation
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  {String(report.score_explanations.recommendation)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Technical Fit Score</span>
            </div>
            <ScoreGauge label="" value={report.fit_score} color="bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Trust Score</span>
            </div>
            <ScoreGauge label="" value={report.trust_score} color="bg-emerald-500" />
          </CardContent>
        </Card>
      </div>

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.strengths.length > 0 ? (
              <ul className="space-y-2">
                {report.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    {String(s)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No strengths identified.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Concerns
            </CardTitle>
          </CardHeader>
          <CardContent>
            {report.concerns.length > 0 ? (
              <ul className="space-y-2">
                {report.concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    {String(c)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No concerns flagged.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Claims Verification */}
      {report.claims_summary && (
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Claims Verification
              <span className="ml-auto text-sm font-normal text-muted-foreground">
                {report.claims_summary.verified_count}/{report.claims_summary.total_claims} verified
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                  ✓ Verified Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.claims_summary.verified_skills.length > 0 ? (
                    report.claims_summary.verified_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-2">
                  ✗ Unverified Skills
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.claims_summary.unverified_skills.length > 0 ? (
                    report.claims_summary.unverified_skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">None</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Confidence */}
      {report.skill_confidence && Object.keys(report.skill_confidence).length > 0 && (
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Skill Confidence Levels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(report.skill_confidence)
                .sort(([, a], [, b]) => b - a)
                .map(([skill, confidence]) => (
                  <ScoreGauge
                    key={skill}
                    label={skill}
                    value={confidence}
                    color={
                      confidence >= 70
                        ? "bg-emerald-500"
                        : confidence >= 40
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Assessment Video Review */}
      <AssessmentReview applicationId={appId} />

      {/* Interview Plan */}
      <Card className="bg-white dark:bg-slate-900 border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Interview Plan
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => genPlan(appId)}
            disabled={planLoading}
          >
            {planLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Brain className="h-3.5 w-3.5" />
            )}
            {planLoading ? "Generating…" : "Regenerate"}
          </Button>
        </CardHeader>
        <CardContent>
          {interviewPlan && Object.keys(interviewPlan).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(interviewPlan).map(([category, questions]) => {
                if (!Array.isArray(questions) || questions.length === 0) return null;
                return (
                  <div key={category}>
                    <h4 className="text-sm font-semibold text-foreground capitalize mb-3 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      {category.replace(/_/g, " ")}
                    </h4>
                    <div className="space-y-3">
                      {(questions as Array<string | { question: string; rationale?: string }>).map((q, i) => {
                        const questionText = typeof q === 'string' ? q : q.question;
                        const rationaleText = typeof q === 'string' ? null : q.rationale;
                        
                        return (
                          <div
                            key={i}
                            className="rounded-lg border border-border p-3 bg-muted/20"
                          >
                            <p className="text-sm font-medium text-foreground">
                              {questionText}
                            </p>
                            {rationaleText && (
                              <p className="text-xs text-muted-foreground mt-1.5 italic">
                                {rationaleText}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 space-y-2">
              <Brain className="h-8 w-8 mx-auto text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Click &quot;Regenerate&quot; to create an AI-powered interview plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
