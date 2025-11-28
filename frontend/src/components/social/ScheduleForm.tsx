import { useState, FormEvent } from 'react';
import { Calendar, Clock, CheckCircle } from 'lucide-react';
import { schedulePost, type ScheduleRequest, type ScheduleResponse } from '../../lib/socialApi';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ScheduleFormProps {
  videoUrl: string;
  caption: string;
  onScheduled: (response: ScheduleResponse) => void;
}

export const ScheduleForm = ({
  videoUrl,
  caption,
  onScheduled,
}: ScheduleFormProps) => {
  const [platforms, setPlatforms] = useState<string[]>(['TikTok']);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduled, setScheduled] = useState<ScheduleResponse | null>(null);

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
      // Combine date and time if both provided
      let scheduledDateTime: string | null = null;
      if (scheduledDate && scheduledTime) {
        scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
      } else if (scheduledDate) {
        scheduledDateTime = `${scheduledDate}T12:00:00`;
      }

      const request: ScheduleRequest = {
        video_url: videoUrl,
        caption: caption,
        platforms: platforms,
        scheduled_time: scheduledDateTime,
      };

      const response = await schedulePost(request);
      setScheduled(response);
      onScheduled(response);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
        'We couldn\'t schedule your post. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (scheduled) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" aria-hidden="true" />
            <CardTitle className="text-green-900">
              Post Scheduled Successfully!
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-800 text-base">
            Your post has been scheduled and will be published to:
          </p>
          <ul className="list-disc list-inside text-green-800 space-y-2">
            {platforms.map((platform) => (
              <li key={platform} className="text-base">
                {platform}
              </li>
            ))}
          </ul>
          {scheduled.external_links && scheduled.external_links.length > 0 && (
            <div className="mt-4">
              <p className="text-green-800 font-semibold mb-2">View your posts:</p>
              <ul className="space-y-2">
                {scheduled.external_links.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 underline text-base"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Video Preview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <video
            src={videoUrl}
            controls
            className="w-full rounded-lg shadow-lg"
            aria-label="Video preview for scheduling"
          >
            Your browser does not support the video tag.
          </video>
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-foreground whitespace-pre-wrap leading-relaxed text-base">
              {caption}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule Post</CardTitle>
          <CardDescription>
            Choose platforms and schedule your post
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Platforms
              </Label>
              <div className="space-y-3">
                {platformOptions.map((platform) => (
                  <div key={platform} className="flex items-center space-x-3">
                    <Checkbox
                      id={`schedule-platform-${platform}`}
                      checked={platforms.includes(platform)}
                      onCheckedChange={() => handlePlatformToggle(platform)}
                      aria-label={`Select ${platform}`}
                    />
                    <Label
                      htmlFor={`schedule-platform-${platform}`}
                      className="text-base font-normal cursor-pointer"
                    >
                      {platform}
                    </Label>
                  </div>
                ))}
              </div>
              {platforms.length === 0 && (
                <p className="text-sm text-destructive">
                  Please select at least one platform
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-base font-semibold">
                  <Calendar className="w-4 h-4 inline mr-2" aria-hidden="true" />
                  Schedule Date (Optional)
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="h-11"
                  aria-describedby="date-description"
                />
                <p id="date-description" className="text-sm text-muted-foreground">
                  Leave empty to post immediately
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-base font-semibold">
                  <Clock className="w-4 h-4 inline mr-2" aria-hidden="true" />
                  Schedule Time (Optional)
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={!scheduledDate}
                  className="h-11"
                  aria-describedby="time-description"
                />
                <p id="time-description" className="text-sm text-muted-foreground">
                  Required if date is set
                </p>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
                <p className="text-destructive text-base font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || platforms.length === 0}
              size="lg"
              className="w-full text-base font-semibold"
              aria-label={scheduledDate ? 'Schedule post' : 'Post now'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  Scheduling...
                </>
              ) : scheduledDate ? (
                'Schedule Post'
              ) : (
                'Post Now'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
