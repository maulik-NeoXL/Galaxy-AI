"use client";

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
      
      {/* Centered Redirect to Chat */}
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to AI Chat</h1>
          <p className="text-gray-600 mb-6">Click below to start chatting</p>
          <Button
            onClick={() => router.push('/chat')}
            className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-2"
          >
            Go to Chat
          </Button>
        </div>
      </div>
    </div>
  );
}
