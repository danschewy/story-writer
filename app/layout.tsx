import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "StoryForge - Collaborative Story Writing",
  description: "Write stories together with friends and AI assistance",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content={"width=device-width, initial-scale=1, maximum-scale=1"}
        />
        <meta name="theme-color" content={"#fef3c7"} />
      </head>
      <body
        className={`${inter.className} bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 min-h-screen`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
