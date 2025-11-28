import { useState, type FormEvent } from 'react';
import { generateMonthlySchedule, type ScheduleRequest, type MonthlySchedule } from '../../lib/scheduleApi';
import { Loader2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ScheduleGeneratorProps {
  onScheduleGenerated: (schedule: MonthlySchedule) => void;
}

export const ScheduleGenerator = ({ onScheduleGenerated }: ScheduleGeneratorProps) => {
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to first day of current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  const [platforms, setPlatforms] = useState<string[]>(['TikTok', 'Instagram']);
  const [postsPerWeek, setPostsPerWeek] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformOptions = ['TikTok', 'Instagram'];

  const handlePlatformToggle = (platform: string) => {
    setPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const request: ScheduleRequest = {
        start_date: startDate,
        platforms,
        posts_per_week: postsPerWeek,
      };

      const schedule = await generateMonthlySchedule(request);
      onScheduleGenerated(schedule);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'We couldn\'t generate your schedule. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Generate Monthly Schedule
        </CardTitle>
        <CardDescription>
          Create a month of content ideas following TikTok best practices and Unicity compliance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="start-date">Start Date (First Day of Month)</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex gap-4">
              {platformOptions.map((platform) => (
                <div key={platform} className="flex items-center space-x-2">
                  <Checkbox
                    id={`platform-${platform}`}
                    checked={platforms.includes(platform)}
                    onCheckedChange={() => handlePlatformToggle(platform)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={`platform-${platform}`}
                    className="font-normal cursor-pointer"
                  >
                    {platform}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="posts-per-week">
              Posts Per Week: {postsPerWeek} (Recommended: 3-7)
            </Label>
            <Input
              id="posts-per-week"
              type="number"
              min="3"
              max="7"
              value={postsPerWeek}
              onChange={(e) => setPostsPerWeek(parseInt(e.target.value) || 5)}
              required
              disabled={isLoading}
            />
            <p className="text-sm text-muted-foreground">
              This will generate approximately {Math.round((postsPerWeek / 7) * 30)} posts for the month
            </p>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" disabled={isLoading || platforms.length === 0} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              'Generate Monthly Schedule'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

