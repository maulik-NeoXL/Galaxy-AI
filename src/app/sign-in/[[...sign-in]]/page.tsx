"use client";

import { SignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { SiOpenai } from 'react-icons/si';
import { useEffect, useState } from 'react';

export default function SignInPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
      <div className="min-h-screen flex bg-white">
      {/* Left Column - Promotional Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden rounded-3xl my-2 ml-2">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          {/* Floating particles */}
          <div className="absolute top-20 right-20 w-2 h-2 bg-white/30 rounded-full animate-pulse"></div>
          <div className="absolute top-40 left-16 w-1 h-1 bg-white/40 rounded-full animate-bounce"></div>
          <div className="absolute top-60 right-32 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse"></div>
          <div className="absolute top-80 left-24 w-1 h-1 bg-white/30 rounded-full animate-bounce"></div>
          <div className="absolute top-32 right-16 w-2 h-2 bg-white/25 rounded-full animate-pulse"></div>
          
          {/* Gradient orbs */}
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
          <div className="absolute bottom-1/3 left-1/3 w-24 h-24 bg-blue-300/20 rounded-full blur-lg"></div>
        </div>

        {/* Back to Home Button */}
        <div className="absolute top-8 left-8 z-20">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Button>
        </div>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white px-12 text-center">
          {/* Brand */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 justify-center">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <SiOpenai className="w-8 h-8 text-white" />
              </div>
              <span className="text-xl font-semibold">Galaxy AI</span>
            </div>
          </div>

          {/* Main heading */}
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4 leading-tight">
              Experience AI at its finest
            </h1>
            <p className="text-sm leading-relaxed text-blue-100 max-w-md mx-auto">
              Join thousands of users who&apos;ve transformed their productivity with intelligent conversations and automation.
            </p>
          </div>


        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center relative lg:rounded-3xl ml-2">

        {/* Form Container */}
        <div className="w-full max-w-sm px-8 py-16 flex flex-col items-center text-center">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600 text-sm mb-0">
              Sign in to continue your AI journey
            </p>
          </div>

          {/* Sign-in Form */}
          <div className="space-y-6">
            {mounted && (
              <SignIn 
                forceRedirectUrl="/chat"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none border-none bg-transparent p-0 flex flex-col items-center text-center',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockContainer: 'space-y-3',
                    socialButtonsBlockButton: 'w-full justify-center border-gray-200 hover:bg-gray-50 transition-colors h-11 text-sm font-medium border',
                    socialButtonsBlockButtonText: 'text-gray-700',
                    dividerLine: 'bg-gray-200',
                    dividerText: 'text-gray-400 text-sm bg-white px-4',
                    formFieldLabel: 'text-sm font-medium text-gray-700 mb-2',
                    formFieldInputWrapper: 'mb-4',
                    formFieldInput: 'border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 rounded-lg h-11 transition-colors',
                    formButtonPrimary: 'w-full bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium h-11 transition-colors',
                    footerActionLink: 'text-blue-600 hover:text-blue-700 text-sm transition-colors',
                    formFieldErrorText: 'text-red-500 text-sm mt-1',
                    formFieldError: 'text-red-500',
                    alertText: 'text-sm',
                    identityInputText: 'border-gray-200 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 rounded-lg h-11',
                    formFieldError__credentials: 'text-red-500 text-sm',
                    formFieldInputShowPasswordButton: 'text-gray-400 hover:text-gray-600',
                    formFieldInputShowPasswordIcon: 'w-4 h-4',
                    footer: 'mt-6 text-center',
                    footerAction: 'text-sm',
                    footerActionText: 'text-gray-600 text-sm',
                    footerActionText__signUp: 'text-sm',
                    footerActionText__signIn: 'text-sm',
                    footerActionLink__signUp: 'text-blue-600 hover:text-blue-700 text-sm font-medium',
                    footerActionLink__signIn: 'text-blue-600 hover:text-blue-700 text-sm font-medium',
                  },
                  layout: {
                    socialButtonsPlacement: 'top',
                  },
                  variables: {
                    colorPrimary: '#111827',
                    colorBackground: '#ffffff',
                    colorText: '#111827',
                    colorTextSecondary: '#6b7280',
                    colorInputBackground: '#ffffff',
                    colorInputText: '#111827',
                    colorDanger: '#EF4444',
                    borderRadius: '8px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '14px',
                  }
                }}
              />
            )}
            
            {!mounted && (
              <div className="w-full h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            )}

            {/* Sign up prompt */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => router.push('/sign-up')}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  Sign up free
                </button>
              </p>
            </div>

            {/* Help links */}
            <div className="text-center pt-6 border-t border-gray-100">
              <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                Need help signing in?
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile overlay */}
      <div className="lg:hidden fixed inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 z-0"></div>
    </div>
  );
}