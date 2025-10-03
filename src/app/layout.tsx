import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import ConditionalLayout from "@/components/ConditionalLayout";
import { cookies } from "next/headers";
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap', // Optimize font loading
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "Galaxy AI - Multi-Model AI Chat Assistant",
    template: "%s | Galaxy AI"
  },
  description: "Experience AI at its finest with Galaxy AI. Chat with GPT-4, Gemini Pro, Grok, and more. Generate images with DALL-E. Smart memory, context management, and seamless conversations.",
  keywords: ["AI chat", "GPT-4", "Gemini Pro", "DALL-E", "artificial intelligence", "chat assistant", "AI conversation"],
  authors: [{ name: "Galaxy AI Team" }],
  creator: "Galaxy AI",
  publisher: "Galaxy AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://galaxy-ai.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Galaxy AI - Multi-Model AI Chat Assistant',
    description: 'Experience AI at its finest with Galaxy AI. Chat with GPT-4, Gemini Pro, Grok, and more.',
    siteName: 'Galaxy AI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Galaxy AI - Multi-Model AI Chat Assistant',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galaxy AI - Multi-Model AI Chat Assistant',
    description: 'Experience AI at its finest with Galaxy AI. Chat with GPT-4, Gemini Pro, Grok, and more.',
    images: ['/og-image.png'],
    creator: '@galaxyai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.png',
  },
  manifest: '/manifest.json',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true"
  
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${inter.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConditionalLayout defaultOpen={defaultOpen}>
              {children}
            </ConditionalLayout>
            <Toaster />
          </ThemeProvider>
          
          {/* Analytics and Performance Monitoring */}
          <Script
            id="performance-monitor"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                // Performance monitoring
                if (typeof window !== 'undefined') {
                  window.addEventListener('load', () => {
                    // Log Core Web Vitals
                    if ('web-vital' in window) {
                      // This would be implemented with web-vitals library
                      console.log('Performance monitoring enabled');
                    }
                  });
                }
              `,
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
