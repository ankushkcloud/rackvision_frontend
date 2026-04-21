'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/authStore';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [f, setF] = useState({ name:'', email:'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password !== f.confirm) { toast.error('Passwords do not match'); return; }
    if (f.password.length < 6)    { toast.error('Password must be ≥ 6 chars');  return; }
    setLoading(true);
    try {
      await register(f.name, f.email, f.password);
      toast.success('Account created!');
      router.push('/dashboard');
    } catch (err) {
      toast.error((err as AxiosError<{error:string}>).response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Create Account</h1>
          <p className="text-gray-500 text-sm mt-1">Start managing your infrastructure</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          {[['Name','text','Full Name','name'],['Email','email','you@example.com','email'],
            ['Password','password','••••••••','password'],['Confirm Password','password','••••••••','confirm']
          ].map(([lbl,type,ph,key]) => (
            <div key={key}>
              <label className="label">{lbl}</label>
              <input type={type} required className="field" placeholder={ph}
                value={(f as Record<string,string>)[key]}
                onChange={e => setF({...f, [key]: e.target.value})} />
            </div>
          ))}
          <button type="submit" disabled={loading} className="btn-blue w-full">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>Creating...</span> : 'Create Account'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Have an account? <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
