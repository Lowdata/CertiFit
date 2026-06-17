"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { useAuthStore } from "@/store/authStore";
import { LayoutDashboard, Briefcase, Users, Settings } from "lucide-react";

const recruiterNavigation = [
  { name: "Overview", href: "/recruiter", icon: LayoutDashboard },
  { name: "Jobs", href: "/recruiter/jobs", icon: Briefcase },
  { name: "Candidates", href: "/recruiter/candidates", icon: Users },
  { name: "Settings", href: "/recruiter/settings", icon: Settings },
];

export default function RecruiterLayout({
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
    } else if (user?.user_type !== 1) {
      // If they are not a recruiter, kick them to candidate
      router.push("/candidate");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.user_type !== 1) return null; // Avoid flashing content

  return (
    <DashboardShell navigation={recruiterNavigation}>
      {children}
    </DashboardShell>
  );
}
