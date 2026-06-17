"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { useISTTheme } from "@/hooks/use-ist-theme";

function ThemeManager({ children }: { children: React.ReactNode }) {
  useISTTheme();
  return <>{children}</>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeManager>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeManager>
      </ThemeProvider>
    </QueryClientProvider>
  );
}