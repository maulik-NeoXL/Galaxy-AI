"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ChevronDown,
  Play
} from "lucide-react";

const LandingPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGetStarted = async () => {
    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleGetStarted();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">★</span>
              </div>
              <span className="text-xl font-bold text-gray-900 font-serif">Claude</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-gray-700">Meet Claude</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-gray-700">Platform</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-gray-700">Solutions</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-gray-700">Pricing</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
              <div className="flex items-center gap-1 cursor-pointer">
                <span className="text-gray-700">Learn</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </div>
            </nav>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-gray-700">
                Contact sales
              </Button>
              <Button 
                onClick={handleGetStarted}
                disabled={isLoading}
                className="bg-black text-white hover:bg-gray-800 rounded-full"
              >
                {isLoading ? "Loading..." : "Try Claude"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex min-h-[calc(100vh-80px)]">
        {/* Left Content */}
        <div className="flex-1 bg-stone-50 flex flex-col justify-center px-6 lg:px-12">
          <div className="max-w-lg">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight font-serif">
              Impossible? Possible.
            </h1>
            <p className="text-xl text-gray-600 mb-12 font-sans">
              The AI for problem solvers
            </p>
            
            {/* Signup Form */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border">
              <Button 
                className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 mb-4 flex items-center justify-center gap-3"
                variant="outline"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-gray-500 text-sm">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                />
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-black text-white hover:bg-gray-800"
                >
                  {isLoading ? "Loading..." : "Continue with email"}
                </Button>
              </form>
            </div>
          </div>
          
          {/* Video Section */}
          <div className="mt-12 max-w-md">
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors">
              <div className="flex items-center gap-3 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 ml-1" />
                </div>
                <div>
                  <p className="font-semibold">Watch how Claude works</p>
                  <p className="text-sm text-gray-300">2:30</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Hero Image */}
        <div className="flex-1 bg-orange-500 relative overflow-hidden">
          {/* Floating Code Symbols */}
          <div className="absolute inset-0">
            <div className={`absolute top-20 left-10 text-4xl text-pink-400 ${isMounted ? 'animate-pulse' : ''}`}>{"{}"}</div>
            <div className={`absolute top-32 right-20 text-3xl text-blue-400 ${isMounted ? 'animate-bounce' : ''}`}>{"[]"}</div>
            <div className={`absolute top-48 left-32 text-2xl text-yellow-400 ${isMounted ? 'animate-pulse' : ''}`}>{"()"}</div>
            <div className={`absolute top-64 right-16 text-3xl text-green-400 ${isMounted ? 'animate-bounce' : ''}`}>{"->"}</div>
            <div className={`absolute top-80 left-20 text-2xl text-pink-400 ${isMounted ? 'animate-pulse' : ''}`}>{"/"}</div>
            <div className={`absolute top-96 right-32 text-4xl text-blue-400 ${isMounted ? 'animate-bounce' : ''}`}>{"*"}</div>
            <div className={`absolute top-1/3 left-16 text-3xl text-yellow-400 ${isMounted ? 'animate-pulse' : ''}`}>{"."}</div>
            <div className={`absolute top-1/2 right-24 text-2xl text-green-400 ${isMounted ? 'animate-bounce' : ''}`}>{"~"}</div>
            <div className={`absolute top-2/3 left-28 text-4xl text-pink-400 ${isMounted ? 'animate-pulse' : ''}`}>{"\""}</div>
            <div className={`absolute bottom-32 right-12 text-3xl text-blue-400 ${isMounted ? 'animate-bounce' : ''}`}>{"{}"}</div>
            <div className={`absolute bottom-20 left-24 text-2xl text-yellow-400 ${isMounted ? 'animate-pulse' : ''}`}>{"[]"}</div>
            <div className={`absolute bottom-48 right-28 text-4xl text-green-400 ${isMounted ? 'animate-bounce' : ''}`}>{"()"}</div>
          </div>
          
          {/* Wooden Steps and Person */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <div className="relative">
              {/* Wooden steps */}
              <div className="w-80 h-20 bg-amber-800 rounded-t-lg shadow-lg"></div>
              <div className="w-64 h-16 bg-amber-700 rounded-t-lg shadow-lg absolute -top-4 left-8"></div>
              <div className="w-48 h-12 bg-amber-600 rounded-t-lg shadow-lg absolute -top-8 left-16"></div>
              
              {/* Person sitting */}
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="w-16 h-20 bg-amber-600 rounded-full relative">
                  {/* Head */}
                  <div className="w-8 h-8 bg-amber-500 rounded-full absolute -top-4 left-1/2 transform -translate-x-1/2"></div>
                  {/* Body with paint splatters */}
                  <div className="w-12 h-16 bg-green-600 rounded-lg absolute top-2 left-1/2 transform -translate-x-1/2">
                    {/* Paint splatters */}
                    <div className="absolute top-2 left-2 w-2 h-2 bg-pink-400 rounded-full"></div>
                    <div className="absolute top-4 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                    <div className="absolute top-6 left-3 w-1 h-1 bg-blue-400 rounded-full"></div>
                    <div className="absolute top-8 right-2 w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;
