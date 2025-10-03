import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-gray-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Error 404 - Page not found
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button asChild className="w-full sm:w-auto">
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
