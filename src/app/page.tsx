'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';

export default function Root() {
  const router = useRouter();
  const { isAuth, hydrate, hydrated } = useAuth();
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => { if (hydrated) router.replace(isAuth ? '/dashboard' : '/auth/login'); }, [hydrated, isAuth, router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
