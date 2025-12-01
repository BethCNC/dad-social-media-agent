import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { NavBar } from '@/components/layout/NavBar';

interface ShellProps {
  children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  console.log('Shell component rendering', children);
  return (
    <div className="min-h-screen bg-bg-page">
      <NavBar />
      <main className="relative">
        {children}
      </main>
      <Toaster />
    </div>
  );
};
