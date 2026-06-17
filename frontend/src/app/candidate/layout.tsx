"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuthStore } from "@/store/authStore";
import { User, Briefcase, ClipboardList, Settings } from "lucide-react";

const candidateNavigation = [
  { name: "Profile", href: "/candidate", icon: User },
  { name: "Explore Jobs", href: "/candidate/jobs", icon: Briefcase },
  { name: "Applied Jobs", href: "/candidate/applications", icon: ClipboardList },
  { name: "Settings", href: "/candidate/settings", icon: Settings },
];

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token;
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    } else if (user?.user_type === 1) {
      // If they are a recruiter, kick them to recruiter
      router.push("/recruiter");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.user_type === 1) return null; // Avoid flashing content

  return (
    <DashboardShell navigation={candidateNavigation}>
      {children}
    </DashboardShell>
  );
}
