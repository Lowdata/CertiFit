"use client";

import { useAssessmentByApplication } from "@/hooks/useAssessments";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, PlayCircle, Video, FileText, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function AssessmentReview({ applicationId }: { applicationId: number }) {
  const { data, isLoading, isError } = useAssessmentByApplication(applicationId);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-border">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="bg-white dark:bg-slate-900 border-border">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Video className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p>No video assessment completed yet.</p>
        </CardContent>
      </Card>
    );
  }

  const { assessment, questions } = data;

  return (
    <Card className="bg-white dark:bg-slate-900 border-border overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-purple-600" />
              AI Video Assessment
            </CardTitle>
            <CardDescription className="mt-1">
              Automated AI evaluation of the candidate's video interview
            </CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className={
              assessment.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              "bg-amber-50 text-amber-700 border-amber-200"
            }
          >
            {assessment.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {assessment.evaluation_summary && (
          <div className="mb-8 bg-slate-50 dark:bg-slate-800 p-5 rounded-lg border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Overall Evaluation
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Score</span>
                <span className="text-2xl font-bold font-mono text-primary">
                  {assessment.overall_score?.toFixed(1) || "N/A"}
                  <span className="text-sm text-muted-foreground">/10</span>
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(assessment.evaluation_summary.metrics || {}).map(([metric, score]) => (
                <div key={metric} className="space-y-1 bg-white dark:bg-slate-900 p-3 rounded shadow-sm border border-border">
                  <div className="text-xs uppercase text-muted-foreground font-semibold">{metric.replace(/_/g, " ")}</div>
                  <div className="font-bold text-lg">{Number(score).toFixed(1)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-8">
          {questions?.map((q: any, i: number) => (
            <div key={q.question.id} className="border border-border rounded-lg overflow-hidden">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                  Question {i + 1} • {q.question.type}
                </div>
                <div className="font-medium">{q.question.text}</div>
              </div>
              
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  {q.recording?.video_url ? (
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video src={q.recording.video_url} controls className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                      No recording available
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-1.5 mb-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Transcript
                    </h4>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded border text-sm text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto">
                      {q.recording?.transcript || <span className="italic text-muted-foreground">Pending processing...</span>}
                    </div>
                  </div>
                  
                  {q.recording?.evaluation && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2">AI Feedback</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(q.recording.evaluation)
                          .filter(([key]) => key !== "reason")
                          .map(([metric, score]) => (
                            <div key={metric} className="flex justify-between items-center border-b pb-1">
                              <span className="text-muted-foreground capitalize">{metric.replace(/_/g, " ")}</span>
                              <span className="font-semibold">{Number(score).toFixed(1)}</span>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
