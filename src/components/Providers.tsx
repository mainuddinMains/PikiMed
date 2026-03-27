"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"
import { Toaster } from "react-hot-toast"
import RegionSelectorModal from "@/components/RegionSelectorModal"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000 },
        },
      }),
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          {/* Shown on first visit when no region is stored in localStorage */}
          <RegionSelectorModal />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "!bg-card !text-card-foreground !border !border-border !rounded-xl !shadow-lg !text-sm",
            }}
          />
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
