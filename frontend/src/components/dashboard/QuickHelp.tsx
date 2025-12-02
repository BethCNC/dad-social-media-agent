import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const QuickHelp = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="border border-border-default">
      <CardHeader className="pb-3">
        <Button
          variant="ghost"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-fg-subtle" />
            <CardTitle className="text-lg font-medium text-fg-headings">
              Need help?
            </CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-fg-subtle" />
          ) : (
            <ChevronDown className="w-5 h-5 text-fg-subtle" />
          )}
        </Button>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Posting */}
            <div className="space-y-2">
              <h3 className="font-semibold text-fg-headings">Daily Posting</h3>
              <ol className="text-sm text-fg-body space-y-1 list-decimal list-inside">
                <li>Click "Create Post"</li>
                <li>Enter topic or use suggestion</li>
                <li>Review script & caption</li>
                <li>Select video/images</li>
                <li>Download & post manually</li>
              </ol>
              <p className="text-xs text-fg-subtle mt-2">
                You'll add trending audio in TikTok/Instagram when posting.
              </p>
            </div>

            {/* Weekly Planning */}
            <div className="space-y-2">
              <h3 className="font-semibold text-fg-headings">Weekly Planning</h3>
              <ol className="text-sm text-fg-body space-y-1 list-decimal list-inside">
                <li>Click "Plan This Week"</li>
                <li>Generate 7 posts</li>
                <li>Review & edit content</li>
                <li>Download as needed</li>
                <li>Post daily with trending audio</li>
              </ol>
              <p className="text-xs text-fg-subtle mt-2">
                Plan ahead, then download and post one video each day.
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

