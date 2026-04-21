'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authStore';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuth, hydrated } = useAuth();
  const router = useRouter();
  useEffect(() => { if (hydrated && !isAuth) router.replace('/auth/login'); }, [hydrated, isAuth, router]);
  if (!hydrated || !isAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1117]">
      <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return <>{children}</>;
}
