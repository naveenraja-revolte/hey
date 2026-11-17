import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/app-header";
import "./globals.css";

const inter = Inter({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Parcel delivery | Send and track parcels",
  description: "Register a parcel and follow its delivery progress.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="bg-background text-foreground flex min-h-full flex-col font-sans">
        <Suspense fallback={<AppHeaderFallback />}>
          <AppHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
