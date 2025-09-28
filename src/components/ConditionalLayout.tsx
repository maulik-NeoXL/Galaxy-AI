"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";

interface ConditionalLayoutProps {
  children: ReactNode;
  defaultOpen: boolean;
}

export default function ConditionalLayout({ children, defaultOpen }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const isSignInPage = pathname.startsWith("/sign-in");
  const isSignUpPage = pathname.startsWith("/sign-up");

  if (isLandingPage || isSignInPage || isSignUpPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main className="w-full">
        {children}
      </main>
    </SidebarProvider>
  );
}
