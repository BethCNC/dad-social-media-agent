import { TrendingUp, Music, Camera, Play, BarChart3, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface TrendItem {
  name: string;
  type: 'Feature' | 'Format' | 'Template' | 'Hashtag';
  views: number;
  growth: number; // Percentage growth
  platform: 'TikTok' | 'Instagram' | 'YouTube';
}

export interface TrendsPulseData {
  new_viral_trends: number;
  rising_templates: number;
  breakout_shorts: number;
  highest_velocity: Array<{
    name: string;
    type: string;
    views: number;
    growth: number;
    platform?: string;
  }>;
  last_updated: string;
}

interface SocialTrendsPulseProps {
  data: TrendsPulseData;
  onTrendClick?: (trend: TrendItem) => void;
}

const formatViews = (views: number): string => {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M`;
  }
  if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}K`;
  }
  return views.toString();
};

const formatTimeAgo = (minutesStr: string | number): string => {
  const minutes = typeof minutesStr === 'string' ? parseInt(minutesStr) || 0 : minutesStr;
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1m ago';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1h ago';
  return `${hours}h ago`;
};

export const SocialTrendsPulse = ({ data, onTrendClick }: SocialTrendsPulseProps) => {
  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              Social Trends Pulse
            </CardTitle>
            <CardDescription className="mt-1">
              Real-time viral topics and formats analysis
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <select className="text-sm border rounded px-3 py-1.5">
              <option>Last 24h</option>
              <option>Last 7d</option>
              <option>Last 30d</option>
            </select>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-1 border-b">
          <button className="px-4 py-2 text-sm font-medium border-b-2 border-black pb-3">
            Overview
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Music className="w-4 h-4 inline mr-1" />
            TikTok
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Camera className="w-4 h-4 inline mr-1" />
            Instagram
          </button>
          <button className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <Play className="w-4 h-4 inline mr-1" />
            YouTube
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Music className="w-8 h-8 text-pink-600 mb-3" />
                <div className="text-3xl font-bold text-pink-900">{data.new_viral_trends}</div>
                <div className="text-sm text-pink-700 mt-1">New Viral Trends</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Camera className="w-8 h-8 text-purple-600 mb-3" />
                <div className="text-3xl font-bold text-purple-900">{data.rising_templates}</div>
                <div className="text-sm text-purple-700 mt-1">Rising Templates</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Play className="w-8 h-8 text-red-600 mb-3" />
                <div className="text-3xl font-bold text-red-900">{data.breakout_shorts}</div>
                <div className="text-sm text-red-700 mt-1">Breakout Shorts</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Highest Velocity Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold uppercase tracking-wide">Highest Velocity</h3>
          <div className="space-y-3">
            {data.highest_velocity && data.highest_velocity.length > 0 ? (
              data.highest_velocity.map((trend, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md",
                    "bg-gradient-to-r from-white to-gray-50"
                  )}
                  onClick={() => onTrendClick?.(trend as TrendItem)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <BarChart3 className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-base">{trend.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {trend.type} • {formatViews(trend.views)} views
                        </span>
                      </div>
                      {/* Mini trend graph placeholder */}
                      <div className="flex items-end gap-1 h-6">
                        {[2, 4, 3, 5, 4, 6, 8].map((height, i) => (
                          <div
                            key={i}
                            className={cn(
                              "w-1 rounded-t",
                              i === 6 ? "bg-green-600" : "bg-green-400"
                            )}
                            style={{ height: `${height * 2.5}px` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-sm font-semibold">
                        +{trend.growth}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No trending data available at this time.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live updating</span>
            <span>•</span>
            <span>Last updated: {formatTimeAgo(data.last_updated)}</span>
          </div>
          <Button variant="outline" size="sm">
            Full Report
            <TrendingUp className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

