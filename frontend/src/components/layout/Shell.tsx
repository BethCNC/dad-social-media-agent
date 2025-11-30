import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Video, Plus, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

interface ShellProps {
  children: ReactNode;
}

export const Shell = ({ children }: ShellProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/weekly', label: 'Weekly Schedule', icon: Calendar },
    { path: '/videos', label: 'Video Library', icon: Video },
    { path: '/wizard', label: 'New Post', icon: Plus },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              AI Social Media Co-Pilot
            </h1>
            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
};
