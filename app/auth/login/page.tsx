'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Sprout } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { motion } from 'framer-motion';
import { signIn as nextAuthSignIn } from 'next-auth/react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<null | 'google' | 'facebook'>(null);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login successful!');
      router.push('/');
    }

    setLoading(false);
  };

  const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
    try {
      setOauthLoading(provider);
      await nextAuthSignIn(provider, { callbackUrl: '/' });
    } catch (error) {
      console.error(error);
      toast.error(`Failed to continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-green-700">
            <Sprout className="h-10 w-10" />
            <span>AgriConnect</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Login to your account to continue</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading || !!oauthLoading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
              <div className="w-full">
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuthSignIn('google')}
                  >
                    <span className="inline-flex items-center justify-center bg-white rounded-sm p-0.5">
                      <svg viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          fill="#4285F4"
                          d="M23.49 12.27c0-.79-.07-1.54-.21-2.27H12v4.3h6.48c-.28 1.48-1.12 2.73-2.39 3.57v2.96h3.87c2.26-2.08 3.53-5.15 3.53-8.56z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.96-1.07 7.95-2.87l-3.87-2.96c-1.08.72-2.47 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.98H1.26v3.12C3.24 21.3 7.29 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.25 14.34A7.21 7.21 0 0 1 4.87 12c0-.81.14-1.59.38-2.34V6.54H1.26A11.96 11.96 0 0 0 0 12c0 1.93.46 3.76 1.26 5.46l3.99-3.12z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.73c1.76 0 3.35.61 4.61 1.81l3.45-3.45C17.96 1.23 15.24 0 12 0 7.29 0 3.24 2.7 1.26 6.54l3.99 3.12C6.2 6.85 8.86 4.73 12 4.73z"
                        />
                      </svg>
                    </span>
                    <span>{oauthLoading === 'google' ? 'Continuing with Google...' : 'Continue with Google'}</span>
                  </Button>
                  {/* <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-center gap-2"
                    disabled={!!oauthLoading}
                    onClick={() => handleOAuthSignIn('facebook')}
                  >
                    <span className="inline-flex items-center justify-center bg-white rounded-full p-0.5">
                      <svg viewBox="0 0 24 24" className="h-4 w-4">
                        <path
                          fill="#1877F2"
                          d="M24 12.073C24 5.406 18.627 0 12 0S0 5.406 0 12.073C0 18.1 4.388 23.095 10.125 24v-8.437H7.078v-3.49h3.047V9.356c0-3.007 1.793-4.668 4.533-4.668 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.492 0-1.956.93-1.956 1.887v2.26h3.328l-.532 3.49h-2.796V24C19.612 23.095 24 18.1 24 12.073z"
                        />
                      </svg>
                    </span>
                    <span>
                      {oauthLoading === 'facebook' ? 'Continuing with Facebook...' : 'Continue with Facebook'}
                    </span>
                  </Button> */}
                </div>
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/auth/signup" className="text-green-700 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
