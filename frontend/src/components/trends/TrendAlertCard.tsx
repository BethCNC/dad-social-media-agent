import { Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface TrendAlert {
  trend_title: string;
  why_it_works: string;
  hook_script: string;
  suggested_caption: string;
  hashtag_searched?: string;
  videos_analyzed?: number;
}

interface TrendAlertCardProps {
  trend: TrendAlert;
  onUseIdea: (trend: TrendAlert) => void;
}

export const TrendAlertCard = ({ trend, onUseIdea }: TrendAlertCardProps) => {
  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-600" />
          <CardTitle className="text-2xl font-bold text-orange-900">
            Trending Now: {trend.trend_title}
          </CardTitle>
        </div>
        <CardDescription className="text-base text-orange-800 mt-2">
          {trend.why_it_works}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
          <div className="flex items-start gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-900 mb-1">Why This Works:</p>
              <p className="text-sm text-orange-800">{trend.why_it_works}</p>
            </div>
          </div>
        </div>
        
        {trend.videos_analyzed && (
          <p className="text-xs text-orange-700">
            Analyzed {trend.videos_analyzed} trending videos{trend.hashtag_searched ? ` for #${trend.hashtag_searched}` : ''}
          </p>
        )}
        
        <Button
          onClick={() => onUseIdea(trend)}
          size="lg"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-6 text-lg"
        >
          Use This Idea
        </Button>
      </CardContent>
    </Card>
  );
};

