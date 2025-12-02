import { HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ContextualHelpProps {
  content: string;
  className?: string;
}

export const ContextualHelp = ({ content, className }: ContextualHelpProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        className="text-fg-subtle hover:text-fg-body transition-colors"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>
      {isOpen && (
        <Card className="absolute top-6 left-0 z-50 w-64 p-3 shadow-lg border border-border-default">
          <CardContent className="p-0">
            <p className="text-sm text-fg-body">{content}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

