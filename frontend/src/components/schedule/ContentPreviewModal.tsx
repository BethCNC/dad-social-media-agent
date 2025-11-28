import { type ScheduledContentItem } from '../../lib/scheduleApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface ContentPreviewModalProps {
  item: ScheduledContentItem | null;
  onClose: () => void;
  onUseContent: (item: ScheduledContentItem) => void;
}

const PILLAR_LABELS: Record<string, string> = {
  education: 'Education',
  routine: 'Routine',
  story: 'Story',
  product_integration: 'Product Integration',
};

export const ContentPreviewModal = ({ item, onClose, onUseContent }: ContentPreviewModalProps) => {
  if (!item) return null;

  const date = new Date(item.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{item.topic}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{formattedDate}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Metadata */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              {PILLAR_LABELS[item.content_pillar] || item.content_pillar}
            </span>
            {item.series_name && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                {item.series_name}
              </span>
            )}
            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
              {item.template_type}
            </span>
          </div>

          {/* Hook */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Hook (First 1-3 seconds)</h3>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-medium">{item.hook}</p>
            </div>
          </div>

          {/* Script */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Script</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{item.script}</p>
            </div>
          </div>

          {/* Caption */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Caption</h3>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm whitespace-pre-wrap">{item.caption}</p>
            </div>
          </div>

          {/* Shot Plan */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Shot Plan</h3>
            <div className="space-y-2">
              {item.shot_plan.map((shot, index) => (
                <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-medium">Shot {index + 1}</p>
                    <span className="text-xs text-muted-foreground">{shot.duration_seconds}s</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{shot.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Keywords */}
          {item.suggested_keywords && item.suggested_keywords.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-2">Suggested Keywords (TikTok SEO)</h3>
              <div className="flex flex-wrap gap-2">
                {item.suggested_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={() => onUseContent(item)} className="flex-1">
              Use This Content
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

