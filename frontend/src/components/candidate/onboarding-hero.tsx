"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";
import { CANDIDATE_QUERY_KEYS } from "@/hooks/use-candidate";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { useUploadResume } from "@/hooks/use-candidate";
import { UploadResumeResponse } from "@/lib/candidate-api";
import { Button } from "@/components/ui/button";

const FEATURE_HIGHLIGHTS = [
  "Resume Intelligence — automatic skill & experience extraction",
  "GitHub Verification — validate technical contributions",
  "LinkedIn Profile Analysis — cross-reference professional history",
  "AI Interview Copilot — tailored question plans for every role",
  "Recruiter Visibility — get matched to the right opportunities",
];

interface OnboardingHeroProps {
  userName?: string;
}

export function OnboardingHero({ userName }: OnboardingHeroProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mismatchWarning, setMismatchWarning] = useState<string | null>(null);
  const { mutate: uploadResume, isPending, isSuccess } = useUploadResume();
  const queryClient = useQueryClient();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selected = acceptedFiles[0];
      if (!selected) return;

      if (selected.size > 5 * 1024 * 1024) {
        setError("File must be under 5 MB.");
        return;
      }
      setError(null);
      setFile(selected);
      uploadResume(selected, {
        onSuccess: (data) => {
          if (data.name_mismatch) {
            setMismatchWarning(
              `Name mismatch detected! Found "${data.name_on_resume}" on your resume but your account name is "${data.registered_name}". The profile has been saved.`
            );
            // Delay refresh so the user can read the error
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.profile });
              queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.normalized });
            }, 5000);
          } else {
            // Immediate refresh
            queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.profile });
            queryClient.invalidateQueries({ queryKey: CANDIDATE_QUERY_KEYS.normalized });
          }
        },
        onError: (err: unknown) => {
          const axiosError = err as { response?: { data?: { detail?: string } } };
          setError(
            axiosError?.response?.data?.detail ??
              "Upload failed. Please try again."
          );
          setFile(null);
        },
      });
    },
    [uploadResume]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    disabled: isPending || isSuccess,
  });

  const firstName = userName?.split(" ")[0] ?? "there";

  return (
    <section className="w-full px-4 sm:px-6 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

          {/* ── Left: Text content ── */}
          <div className="flex flex-col gap-6 lg:pt-4">
            {/* Welcome pill */}
            <div className="inline-flex items-center gap-2 w-fit rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Welcome, {firstName} — let&apos;s get you set up
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-bold tracking-tight text-foreground leading-[1.15]">
                Build your verified{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  AI candidate
                </span>{" "}
                profile.
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md">
                Upload your resume and connect your professional profiles to
                unlock AI-powered matching, trust verification, and interview
                preparation.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-2.5" aria-label="Profile features">
              {FEATURE_HIGHLIGHTS.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            {/* Secondary CTA */}
            <div className="pt-2">
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
              >
                Learn how it works
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* ── Right: Upload card ── */}
          <div className="w-full">
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {/* Card header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">
                  Upload your resume
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  PDF or DOCX — max 5 MB
                </p>
              </div>

              {/* Drop zone / success state */}
              <div className="p-6">
                {isSuccess ? (
                  <div className="space-y-4">
                    <SuccessState fileName={file?.name} />
                    {mismatchWarning && (
                      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 animate-in slide-in-from-top-2">
                        <div className="flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-500">
                              Profile Verified (with warnings)
                            </h4>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                              {mismatchWarning}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div
                      {...getRootProps()}
                      id="resume-dropzone"
                      className={`
                        relative flex flex-col items-center justify-center gap-4
                        rounded-xl border-2 border-dashed p-10 sm:p-12 text-center cursor-pointer
                        transition-all duration-200 select-none
                        ${
                          isDragActive
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-[0.99]"
                            : error
                            ? "border-destructive bg-destructive/5"
                            : isPending
                            ? "border-border bg-muted opacity-70 cursor-not-allowed"
                            : "border-border hover:border-blue-400 hover:bg-muted/60 bg-muted/30"
                        }
                      `}
                      aria-label="Resume upload dropzone"
                    >
                      <input {...getInputProps()} aria-label="File input" />

                      {/* Icon */}
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full transition-colors ${
                          isPending
                            ? "bg-blue-100 dark:bg-blue-900/40"
                            : error
                            ? "bg-destructive/10"
                            : isDragActive
                            ? "bg-blue-100 dark:bg-blue-900/40"
                            : "bg-muted"
                        }`}
                      >
                        {isPending ? (
                          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                        ) : error ? (
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        ) : (
                          <UploadCloud
                            className={`h-6 w-6 ${
                              isDragActive
                                ? "text-blue-600"
                                : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </div>

                      {/* Text */}
                      <div className="space-y-1">
                        {isPending ? (
                          <>
                            <p className="text-sm font-medium text-foreground">
                              Uploading &amp; parsing…
                            </p>
                            <p className="text-xs text-muted-foreground">
                              CertiFit AI is reading your resume. This may take
                              a few seconds.
                            </p>
                          </>
                        ) : error ? (
                          <>
                            <p className="text-sm font-medium text-destructive">
                              {error}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Click or drag again to retry.
                            </p>
                          </>
                        ) : isDragActive ? (
                          <p className="text-sm font-medium text-blue-600">
                            Drop your resume here
                          </p>
                        ) : (
                          <>
                            <p className="text-sm font-medium text-foreground">
                              <span className="text-blue-600 font-semibold hover:underline">
                                Click to upload
                              </span>{" "}
                              or drag &amp; drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Supported: PDF, DOCX — up to 5 MB
                            </p>
                          </>
                        )}
                      </div>

                      {/* Progress bar during upload */}
                      {isPending && (
                        <div className="w-full mt-2">
                          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-[upload-progress_2s_ease-in-out_infinite]" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload button below dropzone — primary CTA */}
                    {!isPending && !error && (
                      <div className="mt-4" {...getRootProps()}>
                        <input {...getInputProps()} />
                        <Button
                          id="upload-resume-cta"
                          className="w-full"
                          size="lg"
                          type="button"
                          aria-label="Upload resume"
                        >
                          <UploadCloud className="h-4 w-4 mr-2" />
                          Upload Resume
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* File type badges */}
              {!isSuccess && (
                <div className="px-6 pb-5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Accepted:
                  </span>
                  {["PDF", "DOCX"].map((ext) => (
                    <span
                      key={ext}
                      className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    >
                      <FileText className="h-3 w-3" />
                      {ext}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SuccessState({ fileName }: { fileName?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">
        Resume uploaded!
      </h3>
      {fileName && (
        <p className="text-xs text-muted-foreground mb-2 truncate max-w-[200px]">
          {fileName}
        </p>
      )}
      <p className="text-sm text-muted-foreground max-w-xs">
        CertiFit is building your verified profile. Your dashboard will update
        automatically.
      </p>
    </div>
  );
}
