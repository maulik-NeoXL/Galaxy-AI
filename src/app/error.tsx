'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Something went wrong!
          </CardTitle>
          <CardDescription className="text-gray-600">
            An unexpected error occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Error 500 - Internal server error
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={reset} className="w-full sm:w-auto">
              Try Again
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/chat">
                Go to Chat
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
