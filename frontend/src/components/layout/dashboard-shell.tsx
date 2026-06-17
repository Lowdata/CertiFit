"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuth } from "@/hooks/useAuth";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

interface DashboardShellProps {
  children: React.ReactNode;
  navigation: NavItem[];
}

export function DashboardShell({ children, navigation }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  
  // Close sidebar on path change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-bold shadow-sm">
                C
              </div>
              <span className="text-xl font-bold tracking-tight">CertiFit</span>
            </Link>
            <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Sidebar Nav */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <item.icon 
                    className={`mr-3 h-5 w-5 flex-shrink-0 ${
                      isActive 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-slate-400 group-hover:text-slate-500 dark:text-slate-400 dark:group-hover:text-slate-300"
                    }`} 
                    aria-hidden="true" 
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Theme</span>
              <ThemeToggle />
            </div>
            
            <div className="flex items-center group w-full p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold uppercase text-xs">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              </div>
              <div className="ml-3 truncate">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{user?.name || "User"}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
            
            <button 
              onClick={logout}
              className="mt-2 flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-bold shadow-sm">
              C
            </div>
          </Link>
          <button
            type="button"
            className="-mr-3 inline-flex h-12 w-12 items-center justify-center rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Main scrollable area */}
        <main className="flex-1 overflow-y-auto outline-none p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
