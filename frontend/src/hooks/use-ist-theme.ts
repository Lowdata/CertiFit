"use client";

import { useTheme } from "next-themes";
import { useEffect, useState, startTransition } from "react";

export function useISTTheme() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    startTransition(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Only apply time-based theme if user hasn't manually set it in this session.
    // However, if we want it to automatically change based on time, we can just check the time.
    // The requirement: "based on the time in ist change the them automatically"
    const checkTimeAndSetTheme = () => {
      // Get current hour in IST (Asia/Kolkata)
      const istTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const istHour = new Date(istTime).getHours();

      // Let's assume day is 6 AM to 6 PM (18:00)
      const isDayTime = istHour >= 6 && istHour < 18;
      
      const expectedTheme = isDayTime ? "light" : "dark";
      
      // If there's no explicitly saved theme, or we want to force time-based:
      // Since next-themes saves to localStorage, let's only auto-set if it's the first visit
      // Or we can just set it if we want it to be fully automatic.
      // Let's check if the user has a preference, if not, or if we want to override:
      const stored = localStorage.getItem("theme");
      if (stored !== "light" && stored !== "dark") {
         setTheme(expectedTheme);
      } else {
         // To make it truly automatic, we might override, but usually it's better to respect user toggle.
         // Let's set a custom flag if the user toggled manually.
         const manuallyToggled = localStorage.getItem("manuallyToggledTheme");
         if (!manuallyToggled) {
           setTheme(expectedTheme);
         }
      }
    };

    checkTimeAndSetTheme();
    
    // Check every minute just in case
    const interval = setInterval(checkTimeAndSetTheme, 60000);
    return () => clearInterval(interval);
  }, [mounted, setTheme]);
}
