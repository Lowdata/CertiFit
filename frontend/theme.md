# CertiFit Design System & Theme Guidelines

This document serves as the source of truth for the visual identity, tone, and UI components of the CertiFit frontend application. Use this file as context to ensure consistency across all new features and pages.

## Core Vibe & Principles

CertiFit is an AI-powered recruitment intelligence platform. The design must communicate:
- **Trust & Professionalism**
- **Intelligence & Enterprise Quality**
- **Modern SaaS Aesthetics**

**What we ARE NOT:**
- We are NOT a crypto startup.
- We are NOT a generic SaaS dashboard.
- We are NOT a cyberpunk AI product (no neon glows, hacker terminals, or dark sci-fi themes).

**Visual Inspiration:**
Linear, Ashby, Greenhouse, Stripe, Notion, Vercel.

## Design Rules

1. **Clean & Minimal:** Rely on typography, structure, and white-space rather than heavy borders or excessive colors.
2. **Subtle Backgrounds:** Avoid giant gradients or pink/purple startup colors. Use soft slate radial patterns or subtle mesh/grid hints.
3. **Seamless Transitions:** Use `transition-colors duration-300` on elements that change color (backgrounds, borders, text) to ensure smooth Light/Dark mode switching.
4. **Interactive States:** Buttons and cards should have subtle hover states (e.g., `hover:bg-blue-700`, `hover:scale-[1.02]`, `shadow-md hover:shadow-lg`).
5. **Component Borders:** Use soft, translucent borders instead of hard lines (e.g., `border-slate-200` in light mode, `border-slate-800` in dark mode).

## Typography

- **Primary Font:** Geist (sans-serif) via `next/font/google`.
- **Hierarchy:** Modern font hierarchy with strong, tracked-tight headings (`tracking-tight`) and readable, relaxed body text (`leading-relaxed`).

## Color Palette

The application fully supports dynamic Light and Dark modes. The theme switches automatically based on IST (India Standard Time) or user toggle.

### Light Mode (Default)
- **Background:** Soft Gray `#FAFAFA` (`bg-slate-50` or `bg-[#FAFAFA]`)
- **Card Background:** Pure White `#FFFFFF` (`bg-white`)
- **Primary Brand:** Blue `#2563EB` (`bg-blue-600` / `text-blue-600`)
- **Primary Hover:** Dark Blue `#1D4ED8` (`hover:bg-blue-700` / `hover:text-blue-700`)
- **Text Primary:** Slate `#0F172A` (`text-slate-900`)
- **Text Secondary:** Slate `#475569` (`text-slate-500` to `text-slate-600`)
- **Border:** Slate `#E2E8F0` (`border-slate-200`)
- **Success:** Emerald `#10B981` (`text-emerald-500`)
- **Warning/Error:** Amber `#F59E0B` (`text-amber-500` / `bg-amber-50`)

### Dark Mode
- **Background:** Deep Slate (`dark:bg-slate-950`)
- **Card Background:** Slate (`dark:bg-slate-900`)
- **Primary Brand:** Blue (`dark:text-blue-400` / `dark:border-blue-800`)
- **Primary Hover:** Light Blue (`dark:hover:text-blue-300`)
- **Text Primary:** Light Gray (`dark:text-slate-50` or `dark:text-slate-100`)
- **Text Secondary:** Medium Gray (`dark:text-slate-400`)
- **Border:** Dark Slate (`dark:border-slate-800` or `dark:border-slate-700`)
- **Success:** Emerald (`dark:text-emerald-400`)
- **Warning/Error:** Amber (`dark:text-amber-500` / `dark:bg-amber-900/20`)

## Common UI Patterns

### Buttons
Primary buttons should be solid with subtle shadows and hover transitions.
`className="bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all"`

### Inputs
Inputs should have standard heights, light borders, and distinct focus rings.
`className="h-11 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-blue-600"`

### Cards
Use shadows rather than heavy borders to lift elements off the page.
`className="bg-white dark:bg-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-slate-200 dark:border-slate-800 transition-colors duration-300"`

### Badges / Tags
Small, pill-shaped tags to denote status or highlight information.
`className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400"`
