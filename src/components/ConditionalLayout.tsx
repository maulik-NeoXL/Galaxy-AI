"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode, lazy, Suspense } from "react";
import dynamic from "next/dynamic";

// Lazy load AppSidebar to improve initial page performance
const LazyAppSidebar = dynamic(() => import("@/components/AppSidebar"), {
  loading: () => (
    <div className="w-64 h-screen bg-gray-100 p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-300 rounded"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
          <div className="h-3 bg-gray-300 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  ),
  ssr: false
});

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
      <LazyAppSidebar />
      <main className="w-full">
        {children}
      </main>
    </SidebarProvider>
  );
}
