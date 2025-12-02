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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
};
