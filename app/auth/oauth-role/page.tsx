'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sprout } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OAuthRolePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [updating, setUpdating] = useState(true);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const role = roleParam === 'farmer' ? 'farmer' : roleParam === 'consumer' ? 'consumer' : null;

    if (!role) {
      router.replace('/');
      return;
    }

    const updateRole = async () => {
      try {
        const res = await fetch('/api/profiles/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to update role');
        }

        router.replace('/');
      } catch (error: any) {
        console.error(error);
        toast.error(error.message || 'Something went wrong while finishing sign up');
        setUpdating(false);
      }
    };

    updateRole();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center space-y-6"
      >
        <Link href="/" className="inline-flex items-center gap-2 text-3xl font-bold text-green-700">
          <Sprout className="h-10 w-10" />
          <span>AgriConnect</span>
        </Link>
        <div className="bg-white/80 backdrop-blur rounded-xl shadow p-8 space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Finishing your sign up</h1>
          <p className="text-sm text-gray-600">
            We&apos;re setting up your AgriConnect account based on your selected role.
          </p>
          {updating ? (
            <p className="text-sm text-gray-500">Please wait...</p>
          ) : (
            <Button onClick={() => router.replace('/')}>Go to home</Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}


