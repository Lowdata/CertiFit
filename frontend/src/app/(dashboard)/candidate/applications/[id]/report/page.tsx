"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Target, Lightbulb, BookOpen, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CandidateReportPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const { data: application, isLoading, isError } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      const { data } = await api.get(`/applications/me`);
      return data.find((app: any) => app.id === parseInt(applicationId));
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20 text-red-500">
        <AlertCircle className="mx-auto w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold">Failed to load report</h2>
        <p>This report might not exist or is not available yet.</p>
      </div>
    );
  }

  const aiMeta = application.ai_status_metadata || {};
  const missingSkills = aiMeta.missing_skills || [];
  const matchedSkills = aiMeta.matched_skills || [];
  const recommendation = aiMeta.recommendation || "Continue developing your skills and exploring new opportunities.";
  const fitReasoning = aiMeta.fit_reasoning || [];
  
  // Notice we purposefully DO NOT expose:
  // - final_fit
  // - confidence
  // - trust_explanation
  // - behavioral_insights (unless sanitized)

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Feedback Report</h1>
          <p className="text-muted-foreground mt-1">Review your AI-generated feedback and gap analysis.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-slate-50 dark:bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-emerald-500" /> Matched Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {matchedSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No specific skills matched yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-50 dark:bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-amber-500" /> Missing Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missingSkills.map((skill: string) => (
                  <Badge key={skill} variant="outline" className="border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                    {skill}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You match all requested skills!</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" /> General Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {recommendation}
          </p>
          {fitReasoning.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Key Takeaways</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                {fitReasoning.map((reason: string, i: number) => (
                  <li key={i}>{reason}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-blue-100 dark:border-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <BookOpen className="w-5 h-5" /> Action Plan & Recommendations
          </CardTitle>
          <CardDescription className="text-blue-600/80 dark:text-blue-400/80">
            Based on this application, here's how to improve your chances in the future.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
              <h4 className="font-semibold text-foreground mb-1">Resume Tip</h4>
              <p>Make sure to explicitly mention {missingSkills.slice(0,2).join(" and ")} on your resume if you have experience with them, as our AI couldn't find them.</p>
            </div>
            
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
              <h4 className="font-semibold text-foreground mb-1">Recommended Certifications</h4>
              <p>Consider taking a crash course or earning a certification in {missingSkills[0] || "relevant technologies"} to close the gap for similar roles.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
