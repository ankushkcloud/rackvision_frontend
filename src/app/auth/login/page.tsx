'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authStore';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      await login(f.email, f.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err) {
      toast.error((err as AxiosError<{error:string}>).response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize:'40px 40px' }} />
      {/* Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4 shadow-lg shadow-blue-500/25">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">RackVision</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to manage your infrastructure</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="label">Email</label>
            <input type="email" required className="field" placeholder="admin@demo.com"
              value={f.email} onChange={e => setF({...f, email: e.target.value})} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required className="field" placeholder="••••••••"
              value={f.password} onChange={e => setF({...f, password: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="btn-blue w-full mt-1">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Signing in...</span> : 'Sign In'}
          </button>
          <p className="text-center text-[11px] text-gray-600 pt-1">
            Demo: <span className="font-mono text-gray-400">admin@demo.com / password123</span>
          </p>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          No account? <Link href="/auth/register" className="text-blue-400 hover:text-blue-300">Create one</Link>
        </p>
      </div>
    </div>
  );
}
