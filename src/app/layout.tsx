import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/ui/Providers';

export const metadata: Metadata = {
  title: 'RackVision — Network Rack Management',
  description: 'Professional IT infrastructure rack and network management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0f1117] text-gray-100 min-h-screen antialiased">
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{
            style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '10px', fontSize: '13px' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }} />
        </Providers>
      </body>
    </html>
  );
}
