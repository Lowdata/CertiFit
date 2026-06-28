"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useCallback, useRef } from "react";
import { useUploadLinkedin } from "@/hooks/use-candidate";

interface ProfileItem {
  key: string;
  label: string;
  description: string;
  done: boolean;
  connectAction?: () => void;
  connectLabel?: string;
  isLoading?: boolean;
}

interface ProfileCompletenessProps {
  hasResume: boolean;
  hasGithub: boolean;
  hasLinkedin: boolean;
  onConnectGithub?: () => void;
}

export function ProfileCompleteness({
  hasResume,
  hasGithub,
  hasLinkedin,
  onConnectGithub,
}: ProfileCompletenessProps) {
  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadLinkedin, isPending: isLinkedinUploading } = useUploadLinkedin();

  const handleLinkedinUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Validate file type
      if (file.type !== "application/pdf") {
        alert("Please upload a PDF file.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert("File must be under 5 MB.");
        return;
      }

      uploadLinkedin(file);
      // Reset input so the same file can be re-selected
      if (linkedinInputRef.current) linkedinInputRef.current.value = "";
    },
    [uploadLinkedin]
  );

  const checklist: ProfileItem[] = [
    {
      key: "resume",
      label: "Resume Uploaded",
      description: "Core profile data parsed by CertiFit AI",
      done: hasResume,
    },
    {
      key: "github",
      label: "GitHub Connected",
      description: "Verify technical skills via real contributions",
      done: hasGithub,
      connectLabel: "Connect",
      connectAction: onConnectGithub,
    },
    {
      key: "linkedin",
      label: "LinkedIn Connected",
      description: "Cross-reference your professional history (PDF export)",
      done: hasLinkedin,
      connectLabel: isLinkedinUploading ? "Uploading…" : "Upload PDF",
      isLoading: isLinkedinUploading,
    },
  ];

  const completedCount = checklist.filter((i) => i.done).length;
  const percent = Math.round((completedCount / checklist.length) * 100);

  const strengthLabel =
    percent === 100
      ? "Complete"
      : percent >= 66
      ? "Strong"
      : percent >= 33
      ? "Moderate"
      : "Getting started";

  const strengthColor =
    percent === 100
      ? "text-emerald-600 dark:text-emerald-400"
      : percent >= 66
      ? "text-blue-600 dark:text-blue-400"
      : percent >= 33
      ? "text-amber-600 dark:text-amber-400"
      : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Profile Strength</h3>
          <span className={`text-sm font-semibold ${strengthColor}`}>
            {strengthLabel}
          </span>
        </div>
        <Progress value={percent} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">
          {completedCount} of {checklist.length} sources connected
        </p>
      </div>

      {/* Checklist */}
      <ul className="divide-y divide-border">
        {checklist.map((item) => (
          <li key={item.key} className="flex items-center gap-3 px-5 py-3.5">
            {/* Status icon */}
            <div className="shrink-0">
              {item.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40" />
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium ${
                  item.done ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>

            {/* Connect button */}
            {!item.done && item.connectLabel && (
              <>
                {item.key === "linkedin" ? (
                  <>
                    <input
                      ref={linkedinInputRef}
                      id="linkedin-pdf-input"
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={handleLinkedinUpload}
                      aria-label="Upload LinkedIn PDF"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={item.isLoading}
                      onClick={() => linkedinInputRef.current?.click()}
                      className="shrink-0 text-xs h-7 px-2.5"
                    >
                      {item.isLoading && (
                        <span className="mr-1.5 h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin inline-block" />
                      )}
                      {item.connectLabel}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={item.connectAction}
                    className="shrink-0 text-xs h-7 px-2.5"
                  >
                    {item.connectLabel}
                  </Button>
                )}
              </>
            )}

            {item.done && (
              <span className="shrink-0 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                Connected
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
