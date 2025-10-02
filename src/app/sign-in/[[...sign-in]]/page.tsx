"use client";

import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Promotional Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Abstract Background Lines */}
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <path
              d="M20,100 Q100,20 180,100 T160,180 Q80,180 100,100 T40,20"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M40,120 Q120,40 200,120 T180,200 Q100,200 120,120 T60,40"
              stroke="white"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </div>

        {/* Left Column Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12">
          {/* Brand Icon */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Greeting */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              Hello<br />
              Galaxy AI! 👋
            </h1>
            <p className="text-lg opacity-90 leading-relaxed">
              Experience intelligent conversations with AI. Get highly productive through 
              automation and save tons of time with seamless chat interactions!
            </p>
          </div>

          {/* Copyright */}
          <div className="absolute bottom-6 left-6 text-sm opacity-75">
            © 2024 Galaxy AI. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center relative">
        {/* Back to Home Button - Top Left */}
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Login Form Container */}
        <div className="w-full max-w-md px-8 py-12">
          {/* Brand Name */}
          <div className="mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Galaxy AI</h2>
          </div>

          {/* Welcome Message */}
          <div className="mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Welcome Back!</h3>
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/sign-up')}
                className="text-blue-600 hover:text-blue-700 underline font-medium"
              >
                Create a new account now,
              </button>{' '}
              it's FREE! Takes less than a minute.
            </p>
          </div>

          {/* Clerk Sign In Component */}
          <div className="space-y-6">
            <SignIn 
              forceRedirectUrl="/chat"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  card: 'shadow-none border-none bg-transparent',
                  headerTitle: 'text-lg font-medium text-gray-900',
                  headerSubtitle: 'text-sm text-gray-500 mb-6',
                  socialButtonsBlockButtonText: 'text-gray-700',
                  socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50 transition-colors duration-200',
                  dividerLine: 'bg-gray-300',
                  dividerText: 'text-gray-500',
                  formFieldLabel: 'text-sm font-medium text-gray-700 mb-2',
                  formFieldInput: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg',
                  formButtonPrimary: 'bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium',
                  footerActionLink: 'text-blue-600 hover:text-blue-700',
                  formFieldErrorText: 'text-red-600 text-sm',
                },
                layout: {
                  socialButtonsPlacement: 'top',
                },
                variables: {
                  colorPrimary: '#111827',
                  colorBackground: '#ffffff',
                  colorText: '#111827',
                  colorInputBackground: '#ffffff',
                  colorInputText: '#111827',
                }
              }}
            />
          </div>

          {/* Additional Help Links */}
          <div className="mt-8 text-center">
            <button className="text-sm text-gray-500 hover:text-gray-700">
              Forget password?{' '}
              <span className="text-blue-600 hover:text-blue-700 underline">Click here</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Promotional Section */}
      <div className="lg:hidden absolute top-0 left-0 w-full h-64 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-0"></div>
    </div>
  );
}
