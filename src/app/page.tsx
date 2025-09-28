"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SiOpenai } from "react-icons/si";
import { useSignIn, useSignUp, useUser } from '@clerk/nextjs';
import { cn } from "@/lib/utils";

const LandingPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  // const [email, setEmail] = useState("");
  // const [isMounted, setIsMounted] = useState(false);
  const { user } = useUser();
  // const { signIn } = useSignIn();
  // const { signUp } = useSignUp();

  // useEffect(() => {
  //   setIsMounted(true);
  // }, []);

  const handleGetStarted = async () => {
    if (user) {
      // User is already signed in, redirect to chat
      router.push("/chat");
      return;
    }

    setIsLoading(true);
    try {
      // Redirect to Clerk sign-up page
      router.push("/sign-up");
    } catch (error) {
      console.error("Error redirecting to sign-up:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    if (user) {
      // User is already signed in, redirect to chat
      router.push("/chat");
      return;
    }

    setIsLoading(true);
    try {
      // Redirect to Clerk sign-in page
      router.push("/sign-in");
    } catch (error) {
      console.error("Error redirecting to sign-in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const handleEmailSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   handleGetStarted();
  // };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-sidebar sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="bg-white rounded-full px-2 py-2 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="px-4">
                <SiOpenai className="w-8 h-8 text-black" />
              </div>
              <Button 
                onClick={handleSignIn}
                disabled={isLoading}
                size="lg" 
                className="px-4 py-4 text-base font-medium rounded-full cursor-pointer"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100vh-80px)] bg-stone-50">
        {/* Grid Background */}
        <div
          className={cn(
            "absolute inset-0",
            "[background-size:40px_40px]",
            "[background-image:linear-gradient(to_right,#e4e4e7_1px,transparent_1px),linear-gradient(to_bottom,#e4e4e7_1px,transparent_1px)]",
          )}
        />
        {/* Radial gradient for the container to give a faded look */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-stone-50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center px-6 lg:px-12">
          <div className="max-w-6xl text-center">
            <div className="space-y-6">
              <h1 className="text-6xl md:text-7xl font-medium text-gray-900 leading-none font-sans">
                Get answers. Find inspiration.<br />
                Be more productive.
              </h1>
              <p className="text-lg text-gray-600 font-sans">
                Now with GPT-5, the smartest, fastest, and most useful model yet, with thinking built in. Available for everyone.
              </p>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex justify-center gap-4 mt-6">
              <Button 
                onClick={handleGetStarted}
                disabled={isLoading}
                size="lg"
                className="px-6 py-6 text-lg font-medium rounded-full cursor-pointer"
              >
                {isLoading ? "Loading..." : "Get started"}
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="px-6 py-6 text-lg font-medium rounded-full cursor-pointer"
              >
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
