import { type WeeklySchedule, type WeeklyPost } from '../../lib/weeklyApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Image, Video, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface WeeklyScheduleViewProps {
  schedule: WeeklySchedule;
  onPostClick: (post: WeeklyPost) => void;
}

const PILLAR_COLORS: Record<string, string> = {
  education: 'bg-blue-100 border-blue-300 text-blue-800',
  routine: 'bg-green-100 border-green-300 text-green-800',
  story: 'bg-purple-100 border-purple-300 text-purple-800',
  product_integration: 'bg-orange-100 border-orange-300 text-orange-800',
};

const PILLAR_LABELS: Record<string, string> = {
  education: 'Education',
  routine: 'Routine',
  story: 'Story',
  product_integration: 'Product',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  ready: 'bg-green-100 text-green-700',
  scheduled: 'bg-blue-100 text-blue-700',
  published: 'bg-purple-100 text-purple-700',
};

export const WeeklyScheduleView = ({ schedule, onPostClick }: WeeklyScheduleViewProps) => {
  const weekStart = parseISO(schedule.week_start_date);
  const weekEnd = parseISO(schedule.week_end_date);

  // Ensure posts are sorted by date
  const sortedPosts = [...schedule.posts].sort((a, b) => 
    parseISO(a.post_date).getTime() - parseISO(b.post_date).getTime()
  );

  // Create a map of date -> post for quick lookup
  const postsByDate = new Map<string, WeeklyPost>();
  sortedPosts.forEach((post) => {
    postsByDate.set(post.post_date, post);
  });

  // Generate 7 days (Monday to Sunday)
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weekDays: (WeeklyPost | null)[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    weekDays.push(postsByDate.get(dateStr) || null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Schedule: {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map((dayName, index) => {
            const post = weekDays[index];
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + index);

            return (
              <div
                key={dayName}
                className={cn(
                  "border rounded-lg p-3 min-h-[200px] flex flex-col",
                  post
                    ? "border-primary cursor-pointer hover:bg-primary/5 transition-colors"
                    : "border-gray-200 bg-gray-50"
                )}
                onClick={() => post && onPostClick(post)}
              >
                <div className="text-sm font-semibold text-gray-600 mb-2">
                  {dayName}
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  {format(date, 'MMM d')}
                </div>

                {post ? (
                  <div className="flex-1 space-y-2">
                    {/* Content Pillar Badge */}
                    <div
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full w-fit",
                        PILLAR_COLORS[post.content_pillar] || 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {PILLAR_LABELS[post.content_pillar] || post.content_pillar}
                    </div>

                    {/* Series Name */}
                    {post.series_name && (
                      <div className="text-xs font-medium text-gray-700 truncate">
                        {post.series_name}
                      </div>
                    )}

                    {/* Template Type Icon */}
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      {post.template_type === 'image' ? (
                        <Image className="h-3 w-3" />
                      ) : (
                        <Video className="h-3 w-3" />
                      )}
                      <span className="capitalize">{post.template_type}</span>
                    </div>

                    {/* Topic */}
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">
                      {post.topic}
                    </div>

                    {/* Status Badge */}
                    <div
                      className={cn(
                        "text-xs font-medium px-2 py-1 rounded-full w-fit",
                        STATUS_COLORS[post.status] || 'bg-gray-100 text-gray-700'
                      )}
                    >
                      {post.status}
                    </div>

                    {/* Media Preview (if rendered) */}
                    {post.media_url && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Rendered
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    No post
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Series Breakdown */}
        {Object.keys(schedule.series_breakdown).length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Series Breakdown:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(schedule.series_breakdown).map(([seriesName, count]) => (
                <span
                  key={seriesName}
                  className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                >
                  {seriesName}: {count} post{count !== 1 ? 's' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

