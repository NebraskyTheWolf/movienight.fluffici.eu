"use client"

import { Inter as FontSans } from "next/font/google";
import "../styles/globals.css";
import {cn, hasPermission} from "@/lib/utils.ts";
import { ThemeProvider } from "@/components/themes.tsx";
import Navbar from "@/components/navbar.tsx";
import React from "react";
import Toast from "@/components/toast.tsx";
import {SessionProvider} from "next-auth/react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
                                     children
                                   }: {
  children: React.ReactNode;
}) {
  return (
      <html lang="en">
      <body
          className={cn(
              "min-h-screen bg-background font-sans antialiased dark",
              fontSans.variable
          )}
      >
      <SessionProvider>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          <Navbar />
          {children}
          <Toast />
        </ThemeProvider>
      </SessionProvider>
      </body>
      </html>
  );
}
