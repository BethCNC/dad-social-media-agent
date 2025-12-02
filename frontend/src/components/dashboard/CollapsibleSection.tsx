import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const CollapsibleSection = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false,
  className 
}: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-border-default rounded-lg overflow-hidden", className)}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-4 h-auto hover:bg-bg-subtle"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-lg font-semibold text-fg-headings">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-fg-subtle" />
        ) : (
          <ChevronDown className="w-5 h-5 text-fg-subtle" />
        )}
      </Button>
      {isOpen && (
        <div className="p-4 pt-0 border-t border-border-default">
          {children}
        </div>
      )}
    </div>
  );
};

