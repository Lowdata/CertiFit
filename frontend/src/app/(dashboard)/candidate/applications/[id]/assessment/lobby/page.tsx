"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Camera, CheckCircle2, Mic, Wifi, ChevronRight, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function AssessmentLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<"pending" | "success" | "error">("pending");
  const [micStatus, setMicStatus] = useState<"pending" | "success" | "error">("pending");
  const [networkStatus, setNetworkStatus] = useState<"pending" | "success" | "error">("pending");
  
  const [agreedQuiet, setAgreedQuiet] = useState(false);
  const [agreedNoHelp, setAgreedNoHelp] = useState(false);
  const [agreedFullscreen, setAgreedFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Test Camera and Mic
    async function testMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        setCameraStatus("success");
        setMicStatus("success");
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Media error", err);
        setCameraStatus("error");
        setMicStatus("error");
      }
    }
    testMedia();

    // Test Network latency
    async function testNetwork() {
      try {
        const start = Date.now();
        await api.get('/health');
        const latency = Date.now() - start;
        if (latency < 2000) {
          setNetworkStatus("success");
        } else {
          setNetworkStatus("error");
        }
      } catch (err) {
        setNetworkStatus("error");
      }
    }
    testNetwork();

    return () => {
      // Cleanup stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const allChecksPassed = 
    cameraStatus === "success" && 
    micStatus === "success" && 
    networkStatus === "success" &&
    agreedQuiet && 
    agreedNoHelp && 
    agreedFullscreen;

  const handleStart = () => {
    // Cleanup stream before navigating
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    router.push(`/candidate/applications/${applicationId}/assessment`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Interview Lobby</h1>
        <p className="text-muted-foreground">Let's make sure everything is working before you begin.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Device Testing */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Check</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-slate-500" />
                  <span className="font-medium">Camera</span>
                </div>
                {cameraStatus === "pending" && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                {cameraStatus === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {cameraStatus === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-slate-500" />
                  <span className="font-medium">Microphone</span>
                </div>
                {micStatus === "pending" && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                {micStatus === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {micStatus === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Wifi className="w-5 h-5 text-slate-500" />
                  <span className="font-medium">Network Connection</span>
                </div>
                {networkStatus === "pending" && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                {networkStatus === "success" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {networkStatus === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              </div>

              {/* Video Preview */}
              <div className="mt-4 aspect-video bg-black rounded-lg overflow-hidden border relative">
                {cameraStatus === "success" ? (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    Camera preview not available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rules & Acknowledgment */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Rules</CardTitle>
              <CardDescription>You must agree to these terms to proceed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <Checkbox 
                  id="rule1" 
                  checked={agreedQuiet} 
                  onCheckedChange={(c) => setAgreedQuiet(c === true)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="rule1" className="text-sm font-medium leading-none cursor-pointer">
                    Quiet Environment
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I am in a quiet room with good lighting and no background distractions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="rule2" 
                  checked={agreedNoHelp} 
                  onCheckedChange={(c) => setAgreedNoHelp(c === true)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="rule2" className="text-sm font-medium leading-none cursor-pointer">
                    Independent Work
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I will not use external resources, multiple monitors, or receive help from others.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox 
                  id="rule3" 
                  checked={agreedFullscreen} 
                  onCheckedChange={(c) => setAgreedFullscreen(c === true)} 
                />
                <div className="grid gap-1.5 leading-none">
                  <label htmlFor="rule3" className="text-sm font-medium leading-none cursor-pointer">
                    Fullscreen & Integrity
                  </label>
                  <p className="text-sm text-muted-foreground">
                    I understand the assessment will run in fullscreen mode and navigating away will impact my integrity score.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button 
            className="w-full" 
            size="lg" 
            disabled={!allChecksPassed}
            onClick={handleStart}
          >
            Enter Assessment Room <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
