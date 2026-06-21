"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useUploadResume } from "@/hooks/use-candidate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { mutate: uploadResume, isPending, isSuccess } = useUploadResume();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError("File must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
      uploadResume(selectedFile, {
        onError: (err: any) => {
          setError(err?.response?.data?.detail || "Failed to upload resume. Please try again.");
          setFile(null);
        }
      });
    }
  }, [uploadResume]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    disabled: isPending || isSuccess
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resume Upload</CardTitle>
        <CardDescription>Upload your latest resume (PDF or DOCX). We will automatically parse your experience.</CardDescription>
      </CardHeader>
      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-medium text-emerald-900 dark:text-emerald-100">Resume Uploaded Successfully!</h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">We are analyzing your profile.</p>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-200 ${
              isDragActive
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : error 
                ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                : "border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-900"
            } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center justify-center space-y-4">
              {isPending ? (
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
                </div>
              ) : error ? (
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              ) : file ? (
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
              )}

              <div className="space-y-1">
                {isPending ? (
                  <>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Uploading resume...</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Please do not close this window.</p>
                  </>
                ) : error ? (
                  <>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
                    <p className="text-xs text-red-500/80">Click or drag again to retry.</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      <span className="text-blue-600 dark:text-blue-400 hover:underline">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">PDF or DOCX (max. 5MB)</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
