"use client";

import { useAuthStore } from "@/store/authStore";

export default function RecruiterDashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {user?.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Here is your recruitment overview for today.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Placeholder metric cards */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Active Jobs</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">0</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Candidates</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">0</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Pending Reviews</h3>
          <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">0</p>
        </div>
      </div>
    </div>
  );
}
