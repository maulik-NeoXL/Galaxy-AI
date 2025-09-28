"use client";

import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-stone-50 relative">
      {/* Back to Home Button - Top Left */}
      <div className="absolute top-6 left-6 z-10">
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Button>
      </div>
      
      {/* Centered Sign In Form */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full">
          <SignIn 
            forceRedirectUrl="/chat"
            appearance={{
              elements: {
                formButtonPrimary: 'bg-black hover:bg-gray-800 text-white rounded-full',
                card: 'shadow-lg border border-gray-200 rounded-lg',
              },
              layout: {
                socialButtonsPlacement: 'bottom',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
