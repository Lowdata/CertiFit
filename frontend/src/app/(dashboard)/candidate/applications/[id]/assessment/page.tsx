"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const Webcam = dynamic(() => import("react-webcam"), { ssr: false });
import { useReactMediaRecorder } from "react-media-recorder";
import { 
  useStartAssessment, 
  useCurrentQuestion, 
  usePresignedUrl, 
  useSubmitRecording 
} from "@/hooks/useAssessments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Video, Square, PlayCircle, CheckCircle2, AlertTriangle } from "lucide-react";

export default function AssessmentRoomPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = Number(params.id);
  
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const hasStarted = useRef(false);
  
  const [prepTimeLeft, setPrepTimeLeft] = useState(30);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState(60);
  const [tabSwitches, setTabSwitches] = useState(0);

  const startAssessmentMut = useStartAssessment();
  const presignedUrlMut = usePresignedUrl();
  const submitRecordingMut = useSubmitRecording();

  // Only enable the question query when we have a valid assessmentId
  const { data: currentQuestionData, refetch: refetchQuestion, isLoading: isQuestionLoading } = useCurrentQuestion(assessmentId ?? 0);

  // Initialize assessment — fire only once
  useEffect(() => {
    if (!applicationId || hasStarted.current) return;
    hasStarted.current = true;

    startAssessmentMut.mutateAsync(applicationId)
      .then((data) => {
        setAssessmentId(data.assessment_id);
        setIsInitializing(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to start assessment. Please try again later.");
        setIsInitializing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ 
    video: true,
    audio: true,
    blobPropertyBag: { type: "video/webm" }
  });

  const handleSubmit = async () => {
    if (!mediaBlobUrl || !assessmentId || !currentQuestionData?.question?.id) return;
    
    setIsSubmitting(true);
    try {
      // 1. Fetch blob from object URL
      const response = await fetch(mediaBlobUrl);
      const blob = await response.blob();
      
      // 2. Get Presigned URL
      const { upload_url, object_key } = await presignedUrlMut.mutateAsync({
        assessmentId,
        questionId: currentQuestionData.question.id
      });
      
      // 3. Upload to R2 directly
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        body: blob,
        headers: {
          "Content-Type": "video/webm"
        }
      });
      
      if (!uploadRes.ok) {
        throw new Error("Failed to upload video to storage");
      }
      
      // 4. Submit object key to backend
      await submitRecordingMut.mutateAsync({
        assessmentId,
        questionId: currentQuestionData.question.id,
        objectKey: object_key,
        tabSwitches
      });
      
      // 5. Cleanup and proceed
      clearBlobUrl();
      // Reset timers for the next question
      setPrepTimeLeft(30);
      setRecordingTimeLeft(60);
      setTabSwitches(0);
      await refetchQuestion();
      
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(err.message || "Failed to submit recording");
      clearBlobUrl(); // Prevent infinite retry loop on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  // Timer logic for prep and recording
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (currentQuestionData?.question && status !== "recording" && !mediaBlobUrl && !isSubmitting) {
      // Prep phase
      timerId = setInterval(() => {
        setPrepTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            startRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (status === "recording") {
      // Recording phase
      timerId = setInterval(() => {
        setRecordingTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerId);
  }, [currentQuestionData?.question, status, mediaBlobUrl, isSubmitting, startRecording, stopRecording]);

  // Auto-submit when recording is available
  useEffect(() => {
    if (mediaBlobUrl && !isSubmitting && currentQuestionData?.question?.id) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaBlobUrl, isSubmitting, currentQuestionData?.question?.id]);

  // Track tab switching for integrity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && currentQuestionData?.question) {
        setTabSwitches(prev => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [currentQuestionData?.question]);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-semibold">Preparing your assessment room...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-center">
        <h2 className="text-lg font-bold mb-2">Error</h2>
        <p>{error}</p>
        <Button onClick={() => router.push("/candidate/applications")} className="mt-4" variant="destructive">
          Go Back
        </Button>
      </div>
    );
  }

  if (currentQuestionData?.status === "completed") {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-12">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">Assessment Completed!</h1>
        <p className="text-muted-foreground text-lg">
          Thank you for completing the assessment. Your recordings are now being processed by our AI and will be reviewed by the recruiting team shortly.
        </p>
        <Button onClick={() => router.push("/candidate/applications")} size="lg">
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const question = currentQuestionData?.question;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Interview Assessment</h1>
          <p className="text-muted-foreground">Follow the instructions and record your answers clearly.</p>
        </div>
        {question && (
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-semibold">
            Question {question.index + 1}
          </div>
        )}
      </div>

      {isQuestionLoading ? (
        <Card className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></Card>
      ) : question ? (
        <div className="space-y-4">
          {tabSwitches > 0 && (
            <div className="bg-destructive/15 text-destructive border border-destructive/30 px-4 py-3 rounded-lg flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                Warning: You have switched tabs {tabSwitches} time(s) during this question. This is recorded and will affect your integrity score.
              </p>
            </div>
          )}
          
          <Card className="overflow-hidden border-border/50 shadow-lg">
          <CardHeader className="bg-slate-50 dark:bg-slate-900 border-b">
            <CardDescription className="uppercase tracking-widest font-semibold text-primary mb-2">
              {question.type} Question
            </CardDescription>
            <CardTitle className="text-2xl leading-relaxed">{question.text}</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative mb-6">
              {!mediaBlobUrl ? (
                <Webcam 
                  audio={false} 
                  mirrored={true}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video src={mediaBlobUrl} controls className="w-full h-full object-contain" />
              )}
              
              {status === "recording" && (
                <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/20 backdrop-blur-md text-red-50 px-3 py-1.5 rounded-full border border-red-500/30">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-sm font-medium">Recording</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {status !== "recording" && !mediaBlobUrl && !isSubmitting && (
                  <Button onClick={startRecording} size="lg" className="w-full sm:w-auto gap-2">
                    <Video className="w-5 h-5" />
                    Start Recording ({prepTimeLeft}s)
                  </Button>
                )}
                {status === "recording" && (
                  <Button onClick={stopRecording} size="lg" variant="destructive" className="w-full sm:w-auto gap-2">
                    <Square className="w-5 h-5" />
                    Stop Recording ({recordingTimeLeft}s)
                  </Button>
                )}
                {(isSubmitting || mediaBlobUrl) && (
                  <Button disabled size="lg" className="gap-2 w-full sm:w-auto">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {status === "recording" 
                  ? "Recording in progress. Max duration 1 minute." 
                  : "Ensure your face is visible and microphone is unmuted."}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      ) : null}
    </div>
  );
}
