import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { NavBar } from '@/components/layout/NavBar';

interface ShellProps {
  children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  return (
    <div className="min-h-screen bg-bg-page">
      <NavBar />
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
};
