'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Sprout } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, string> = {
  OAuthAccountNotLinked:
    'This email is already registered with a different sign-in method. Please log in using that method instead.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || '';
  const provider = searchParams.get('provider') || '';

  const friendlyMessage =
    ERROR_MESSAGES[error] ||
    'Something went wrong while trying to sign you in. Please try again or use a different method.';

  const providerLabel = provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-red-700">
            <Sprout className="h-10 w-10" />
            <span>AgriConnect</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-red-700">Sign-in issue</CardTitle>
            <CardDescription>We couldn&apos;t complete your sign-in.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-700">{friendlyMessage}</p>
            {error === 'OAuthAccountNotLinked' && providerLabel && (
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>
                  If you originally signed up with <span className="font-medium">email &amp; password</span>, please use
                  the login form instead of {providerLabel}.
                </li>
                <li>
                  If you want to use {providerLabel} in the future, log in first with your existing method and then link
                  it from your account settings (when available).
                </li>
              </ul>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">Go to login</Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Still stuck? You can also try using a different browser or clearing cookies.
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}


