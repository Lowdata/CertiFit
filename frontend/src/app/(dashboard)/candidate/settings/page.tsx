"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useCandidateProfile, useDeleteCandidate } from "@/hooks/use-candidate";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserX, User, Mail, ShieldAlert } from "lucide-react";

export default function CandidateSettingsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { data: profile } = useCandidateProfile();
  const { mutateAsync: deleteCandidate, isPending: isDeleting } = useDeleteCandidate();
  
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [error, setError] = useState("");

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setError("Please type DELETE to confirm.");
      return;
    }

    try {
      setError("");
      await deleteCandidate();
      logout();
      router.push("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete account. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences and data.</p>
      </div>

      <div className="grid gap-8">
        {/* Account Info */}
        <Card className="bg-white dark:bg-slate-900 border-border">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Account Information
            </CardTitle>
            <CardDescription>Your basic account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="name" value={user?.name || ""} disabled className="pl-9 bg-slate-50 dark:bg-slate-800/50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={user?.email || ""} disabled className="pl-9 bg-slate-50 dark:bg-slate-800/50" />
                </div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
              <AlertCircle className="h-3.5 w-3.5" />
              To update your name or email, please contact support.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="text-xl text-red-600 dark:text-red-500 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Permanently delete your profile, resume data, and all applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-slate-950 border border-red-100 dark:border-red-900/50 p-4 rounded-lg space-y-3">
              <h4 className="font-semibold text-foreground">Delete Account</h4>
              <p className="text-sm text-muted-foreground">
                Once you delete your account, there is no going back. Please be certain.
                This will instantly remove your parsed resume, LinkedIn data, GitHub connections, 
                and all job applications from the platform.
              </p>
              
              <div className="pt-4 space-y-3">
                <Label htmlFor="confirm-delete" className="text-foreground">
                  Type <span className="font-mono font-bold text-red-600">DELETE</span> to confirm
                </Label>
                <Input 
                  id="confirm-delete" 
                  value={deleteConfirmation} 
                  onChange={(e) => setDeleteConfirmation(e.target.value)} 
                  placeholder="DELETE"
                  className="max-w-xs focus-visible:ring-red-500"
                />
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600 mt-2">{error}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={deleteConfirmation !== "DELETE" || isDeleting}
              className="gap-2"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
              {!isDeleting && <UserX className="h-4 w-4" />}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
