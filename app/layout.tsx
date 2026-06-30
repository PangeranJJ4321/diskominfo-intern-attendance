import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { PwaProvider } from "@/components/custom/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "DISKOMINFO-INTERN",
  description: "DISKOMINFO Intern Attendance System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DISKOMINFO-INTERN",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#18181b",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <PwaProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider>{children}</TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
