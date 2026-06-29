"use client";

import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

// MOCK DATA for now, until the AI Engine backend endpoint is built in Phase 2
const MOCK_CANDIDATES = [
  {
    id: 1,
    name: "Charlie Davis",
    role: "Senior Frontend Engineer",
    trust_score: 94,
    skills_match: 90,
    experience_match: "5 years (Required 4+)",
    ai_summary: "Strong candidate with excellent React skills. High trust score indicates verified GitHub activity. Good fit for the senior role.",
    status: "interview",
    key_skills: ["React", "TypeScript", "Next.js"],
    missing_skills: ["GraphQL"],
  },
  {
    id: 2,
    name: "Alice Smith",
    role: "Senior Frontend Engineer",
    trust_score: 72,
    skills_match: 85,
    experience_match: "3 years (Required 4+)",
    ai_summary: "Good technical skills but falls slightly short on required experience. Needs technical screening to verify complex state management knowledge.",
    status: "applied",
    key_skills: ["React", "JavaScript", "Redux"],
    missing_skills: ["TypeScript", "Next.js"],
  },
  {
    id: 3,
    name: "Bob Johnson",
    role: "Senior Frontend Engineer",
    trust_score: 88,
    skills_match: 95,
    experience_match: "6 years (Required 4+)",
    ai_summary: "Highly experienced candidate. Excellent match across all required skills. High trust score due to verified LinkedIn history.",
    status: "applied",
    key_skills: ["React", "TypeScript", "Next.js", "GraphQL"],
    missing_skills: [],
  }
];

export default function CandidateComparePage() {
  const [candidates] = useState(MOCK_CANDIDATES);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto py-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/recruiter"
              className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Candidate Compare <Bot className="w-6 h-6 text-blue-500" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            AI-powered side-by-side comparison of your top candidates.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead className="w-[200px] font-semibold text-slate-900 dark:text-slate-100">Candidate</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Trust Score</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Skills Match</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Experience</TableHead>
                <TableHead className="w-[300px] font-semibold text-slate-900 dark:text-slate-100">AI Summary</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Key Skills</TableHead>
                <TableHead className="font-semibold text-slate-900 dark:text-slate-100">Missing Skills</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((candidate) => (
                <TableRow key={candidate.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                  <TableCell>
                    <div className="font-medium text-slate-900 dark:text-slate-50">{candidate.name}</div>
                    <div className="text-sm text-slate-500">{candidate.role}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        candidate.trust_score >= 90 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        candidate.trust_score >= 80 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {candidate.trust_score}%
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            candidate.skills_match >= 90 ? 'bg-emerald-500' :
                            candidate.skills_match >= 80 ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${candidate.skills_match}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{candidate.skills_match}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-700 dark:text-slate-300">
                    {candidate.experience_match}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                    {candidate.ai_summary}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {candidate.key_skills.map((skill) => (
                        <span key={skill} className="px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {candidate.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {candidate.missing_skills.map((skill) => (
                          <span key={skill} className="px-2 py-0.5 rounded text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> None
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

    </div>
  );
}
