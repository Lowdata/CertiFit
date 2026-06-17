"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* Mobile Menu */}
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
