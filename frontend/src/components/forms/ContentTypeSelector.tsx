import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Calendar, CalendarDays, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ContentType = 'single' | 'weekly' | 'monthly' | 'custom';

interface ContentTypeSelectorProps {
  onSelect: (type: ContentType, customCount?: number) => void;
  selectedType?: ContentType;
}

export const ContentTypeSelector = ({ onSelect, selectedType }: ContentTypeSelectorProps) => {
  const [customCount, setCustomCount] = useState<number>(7);
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (type: ContentType) => {
    if (type === 'custom') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      onSelect(type);
    }
  };

  const handleCustomSubmit = () => {
    if (customCount > 0 && customCount <= 90) {
      onSelect('custom', customCount);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What would you like to create?</h2>
        <p className="text-muted-foreground text-base">
          Choose how many posts you want to generate
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Single Post */}
        <button
          type="button"
          onClick={() => handleSelect('single')}
          className={cn(
            'p-6 border-2 rounded-lg text-left transition-all h-full',
            selectedType === 'single'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start gap-4">
            <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-lg mb-2">Single Post</div>
              <div className="text-sm text-muted-foreground">
                Create one custom post with your own topic and idea
              </div>
            </div>
          </div>
        </button>

        {/* Weekly Schedule */}
        <button
          type="button"
          onClick={() => handleSelect('weekly')}
          className={cn(
            'p-6 border-2 rounded-lg text-left transition-all h-full',
            selectedType === 'weekly'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start gap-4">
            <CalendarDays className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-lg mb-2">Weekly Schedule</div>
              <div className="text-sm text-muted-foreground">
                Generate 7 posts for the week with AI-suggested topics
              </div>
            </div>
          </div>
        </button>

        {/* Monthly Schedule */}
        <button
          type="button"
          onClick={() => handleSelect('monthly')}
          className={cn(
            'p-6 border-2 rounded-lg text-left transition-all h-full',
            selectedType === 'monthly'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start gap-4">
            <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-lg mb-2">Monthly Schedule</div>
              <div className="text-sm text-muted-foreground">
                Generate a full month of content (30 days, ~12 posts)
              </div>
            </div>
          </div>
        </button>

        {/* Custom */}
        <button
          type="button"
          onClick={() => handleSelect('custom')}
          className={cn(
            'p-6 border-2 rounded-lg text-left transition-all h-full',
            selectedType === 'custom'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <div className="flex items-start gap-4">
            <Hash className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <div className="font-semibold text-lg mb-2">Custom</div>
              <div className="text-sm text-muted-foreground">
                Specify exactly how many posts you want (1-90)
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* Custom Input */}
      {showCustomInput && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">How many posts?</CardTitle>
            <CardDescription>
              Enter a number between 1 and 90
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customCount">Number of Posts</Label>
              <Input
                id="customCount"
                type="number"
                min="1"
                max="90"
                value={customCount}
                onChange={(e) => setCustomCount(parseInt(e.target.value) || 1)}
                className="text-lg h-12"
              />
            </div>
            <Button
              onClick={handleCustomSubmit}
              disabled={customCount < 1 || customCount > 90}
              size="lg"
              className="w-full"
            >
              Create {customCount} Post{customCount !== 1 ? 's' : ''}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

