"use client";

import { Navbar } from "@/components/custom/navbar";

interface InternLayoutProps {
  children: React.ReactNode;
}

export default function InternLayout({ children }: InternLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
