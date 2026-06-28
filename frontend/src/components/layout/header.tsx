"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  LayoutDashboard,
  Briefcase,
  FileText,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";

// Helper — returns up to 2 uppercase initials from a name
function getInitials(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

// Role label
function getRoleLabel(userType: 1 | 2): string {
  return userType === 1 ? "Recruiter" : "Candidate";
}

// Candidate nav links
const CANDIDATE_NAV = [
  { href: "/candidate/profile", label: "Dashboard", icon: LayoutDashboard },
  { href: "/candidate/jobs", label: "Jobs", icon: Briefcase },
  { href: "/candidate/applications", label: "Applications", icon: FileText },
];

// Recruiter nav links
const RECRUITER_NAV = [
  { href: "/recruiter/jobs", label: "Jobs", icon: Briefcase },
  { href: "/recruiter", label: "Applications", icon: FileText },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { token, user } = useAuthStore();
  const { logout } = useAuth();

  const isAuthenticated = !!token && !!user;
  const initials = user ? getInitials(user.name) : "";
  const navLinks = user?.user_type === 1 ? RECRUITER_NAV : CANDIDATE_NAV;

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // ───────────────────────────── AUTHENTICATED HEADER ─────────────────────────────
  if (isAuthenticated && user) {
    return (
      <header className="fixed top-0 w-full z-50 border-b border-border bg-background/95 backdrop-blur-xl transition-all duration-300 supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 h-16">

          {/* Logo */}
          <Link href={user.user_type === 1 ? "/recruiter" : "/candidate/profile"} className="flex items-center gap-2 group shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-sm group-hover:scale-105 transition-transform duration-200">
              C
            </div>
            <span className="text-base font-bold tracking-tight text-foreground hidden sm:block">
              CertiFit
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive(href)
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Notification bell — future use */}
            <button
              className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Notifications (coming soon)"
              title="Notifications coming soon"
            >
              <Bell className="h-4 w-4" />
            </button>

            <ThemeToggle />

            {/* User Avatar + Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  id="user-menu-trigger"
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent transition-colors outline-none"
                  aria-label="User menu"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs font-semibold bg-blue-600 text-white">
                      {initials || <User className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-60">
                {/* User info header */}
                <div className="px-3 py-2.5 border-b border-border">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="text-sm font-semibold bg-blue-600 text-white">
                        {initials || <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {getRoleLabel(user.user_type)}
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenuLabel className="text-xs text-muted-foreground pt-2">
                  Account
                </DropdownMenuLabel>

                <DropdownMenuItem asChild>
                  <Link href={user.user_type === 2 ? "/candidate/profile" : "/recruiter"} className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem disabled className="text-muted-foreground">
                  <span className="flex items-center gap-2 w-full">
                    <FileText className="h-4 w-4" />
                    Settings
                    <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      Soon
                    </span>
                  </span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => logout()}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Right */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              id="mobile-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-muted-foreground hover:text-foreground p-2 rounded-md hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu — Authenticated */}
        {menuOpen && (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden shadow-lg">
            {/* User info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="text-sm font-semibold bg-blue-600 text-white">
                  {initials || <User className="h-5 w-5" />}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                <span className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {getRoleLabel(user.user_type)}
                </span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 mb-4">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive(href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="border-t border-border pt-4">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </div>
        )}
      </header>
    );
  }

  // ───────────────────────────── PUBLIC HEADER (unchanged) ─────────────────────────────
  return (
    <header className="fixed top-0 w-full z-50 border-b border-white/20 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-bold shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">CertiFit</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#features" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            Platform
          </Link>
          <Link href="/#how-it-works" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            How it works
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-slate-900 dark:bg-white px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md transition-all hover:scale-105"
          >
            Get started
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-slate-600 dark:text-slate-400 p-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu — Public */}
      {menuOpen && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-6 md:hidden shadow-2xl">
          <div className="flex flex-col gap-6">
            <Link href="/#features" className="text-base font-medium text-slate-600 dark:text-slate-400" onClick={() => setMenuOpen(false)}>
              Platform
            </Link>
            <Link href="/#how-it-works" className="text-base font-medium text-slate-600 dark:text-slate-400" onClick={() => setMenuOpen(false)}>
              How it works
            </Link>
            <div className="h-px w-full bg-slate-100 dark:bg-slate-800" />
            <Link href="/login" className="text-base font-medium text-slate-600 dark:text-slate-300" onClick={() => setMenuOpen(false)}>
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white shadow-md"
              onClick={() => setMenuOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
