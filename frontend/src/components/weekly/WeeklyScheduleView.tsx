import { useState, useEffect } from 'react';
import { type WeeklySchedule, type WeeklyPost } from '../../lib/weeklyApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Image, Video, Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { searchAssets, searchAssetsContextual } from '@/lib/assetsApi';

interface WeeklyScheduleViewProps {
  schedule: WeeklySchedule;
  onPostClick: (post: WeeklyPost) => void;
}

const PILLAR_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  education: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  routine: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  story: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  product_integration: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
};

const PILLAR_LABELS: Record<string, string> = {
  education: 'Education',
  routine: 'Routine',
  story: 'Story',
  product_integration: 'Product',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700' },
  ready: { bg: 'bg-green-100', text: 'text-green-700' },
  scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
  published: { bg: 'bg-purple-100', text: 'text-purple-700' },
};

interface PostCardProps {
  post: WeeklyPost;
  date: Date;
  dayName: string;
  previewThumbnail?: string;
  onClick: () => void;
}

const PostCard = ({ post, date, dayName, previewThumbnail, onClick }: PostCardProps) => {
  const pillarColors = PILLAR_COLORS[post.content_pillar] || { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  const statusColors = STATUS_COLORS[post.status] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  // Determine preview source - prioritize rendered media, then thumbnail, then placeholder
  const hasRenderedMedia = !!post.media_url;
  const hasPreviewThumbnail = !!previewThumbnail;

  return (
    <Card
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]",
        "flex flex-col overflow-hidden",
        pillarColors.border,
        "border-2"
      )}
      onClick={onClick}
    >
      <CardContent className="p-0 flex flex-col h-full">
        {/* Header */}
        <div className="px-4 pt-4 pb-2 space-y-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {dayName}
              </div>
              <div className="text-sm font-bold text-gray-900">
                {format(date, 'MMM d')}
              </div>
            </div>
            <div className={cn(
              "px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide",
              pillarColors.bg,
              pillarColors.text
            )}>
              {PILLAR_LABELS[post.content_pillar] || post.content_pillar}
            </div>
          </div>
        </div>

        {/* Preview Section - Always visible */}
        <div className="px-4 pb-3 flex-1 min-h-[280px]">
          <div className="relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-50 shadow-inner">
            {hasRenderedMedia ? (
              // Rendered media
              <>
                {post.template_type === 'image' ? (
                  <img
                    src={post.media_url!}
                    alt={post.topic}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={post.media_url!}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                )}
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-[10px] font-semibold shadow-lg">
                  ✓ Rendered
                </div>
              </>
            ) : hasPreviewThumbnail ? (
              // Preview thumbnail
              <>
                <img
                  src={previewThumbnail}
                  alt={post.topic}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-[10px] font-semibold shadow-lg">
                  Preview
                </div>
              </>
            ) : (
              // Enhanced placeholder
              <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 relative overflow-hidden">
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0" style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.15) 1px, transparent 0)`,
                    backgroundSize: '24px 24px'
                  }}></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10 text-center w-full space-y-3">
                  {/* Icon */}
                  <div className="flex justify-center">
                    {post.template_type === 'image' ? (
                      <Image className="h-10 w-10 text-gray-400" />
                    ) : (
                      <Video className="h-10 w-10 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Topic */}
                  <div>
                    <p className="text-xs font-bold text-gray-800 line-clamp-2 px-2 leading-tight">
                      {post.topic}
                    </p>
                  </div>
                  
                  {/* Hook preview */}
                  <div>
                    <p className="text-[10px] text-gray-600 line-clamp-2 px-2 leading-tight">
                      {post.hook}
                    </p>
                  </div>
                  
                  {/* Shot plan indicator */}
                  {post.shot_plan && post.shot_plan.length > 0 && (
                    <div className="flex items-center justify-center gap-1.5 pt-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] text-gray-500 font-medium">
                        {post.shot_plan.length} shot{post.shot_plan.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  
                  {/* Status */}
                  <div className="pt-2 border-t border-gray-300">
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide",
                      statusColors.text
                    )}>
                      {post.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Info */}
        <div className="px-4 pb-4 space-y-2 border-t border-gray-100 pt-3">
          {/* Series Name */}
          {post.series_name && (
            <div className="text-xs font-semibold text-gray-700 truncate">
              {post.series_name}
            </div>
          )}

          {/* Topic */}
          <div className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
            {post.topic}
          </div>

          {/* Hook Preview */}
          <div className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {post.hook}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              {post.template_type === 'image' ? (
                <Image className="h-3.5 w-3.5 text-gray-400" />
              ) : (
                <Video className="h-3.5 w-3.5 text-gray-400" />
              )}
              <span className="text-[10px] text-gray-500 capitalize">
                {post.template_type}
              </span>
            </div>
            <div className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-semibold",
              statusColors.bg,
              statusColors.text
            )}>
              {post.status}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


const EmptyDayCard = ({ date, dayName }: { date: Date; dayName: string }) => {
  return (
    <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
      <CardContent className="p-4 flex flex-col items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            {dayName}
          </div>
          <div className="text-sm font-medium text-gray-500">
            {format(date, 'MMM d')}
          </div>
          <div className="text-xs text-gray-400 mt-4">
            No post scheduled
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const WeeklyScheduleView = ({ schedule, onPostClick }: WeeklyScheduleViewProps) => {
  const weekStart = parseISO(schedule.week_start_date);
  const weekEnd = parseISO(schedule.week_end_date);
  const [previewThumbnails, setPreviewThumbnails] = useState<Record<number, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Record<number, boolean>>({});

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

  // Fetch preview thumbnails for ALL posts without media_url (not just drafts)
  useEffect(() => {
    const fetchPreviews = async () => {
      const postsToFetch = sortedPosts.filter(
        (post) => 
          !post.media_url && // No rendered media
          post.shot_plan.length > 0 && // Has shot plan
          post.id && // Has ID
          !previewThumbnails[post.id] && // Not already fetched
          !loadingPreviews[post.id] // Not currently loading
      );

      if (postsToFetch.length === 0) return;

      // Mark as loading
      const newLoading: Record<number, boolean> = {};
      postsToFetch.forEach(post => {
        if (post.id) newLoading[post.id] = true;
      });
      setLoadingPreviews(prev => ({ ...prev, ...newLoading }));

      const newThumbnails: Record<number, string> = {};

      // Fetch in parallel with a small delay to avoid rate limiting
      await Promise.all(
        postsToFetch.map(async (post, index) => {
          if (!post.id) return;

          // Stagger requests slightly
          await new Promise(resolve => setTimeout(resolve, index * 100));

          try {
            // Use contextual search for better relevance
            const results = await searchAssetsContextual({
              topic: post.topic,
              hook: post.hook,
              script: post.script,
              shot_plan: post.shot_plan,
              content_pillar: post.content_pillar,
              suggested_keywords: post.suggested_keywords || [],
              max_results: 1, // Just need one for preview
            });
            
            if (results.length > 0 && results[0].thumbnail_url) {
              newThumbnails[post.id] = results[0].thumbnail_url;
            } else {
              // Fallback to simple search using first shot description
              if (post.shot_plan[0]?.description) {
                const fallbackResults = await searchAssets(post.shot_plan[0].description, 1);
                if (fallbackResults.length > 0 && fallbackResults[0].thumbnail_url) {
                  newThumbnails[post.id] = fallbackResults[0].thumbnail_url;
                }
              }
            }
          } catch (error) {
            // Fallback to simple search
            try {
              if (post.shot_plan[0]?.description) {
                const fallbackResults = await searchAssets(post.shot_plan[0].description, 1);
                if (fallbackResults.length > 0 && fallbackResults[0].thumbnail_url) {
                  newThumbnails[post.id] = fallbackResults[0].thumbnail_url;
                }
              }
            } catch (fallbackError) {
              console.error(`Failed to fetch preview for post ${post.id}:`, fallbackError);
            }
          } finally {
            // Mark as not loading
            setLoadingPreviews(prev => {
              const updated = { ...prev };
              delete updated[post.id!];
              return updated;
            });
          }
        })
      );

      if (Object.keys(newThumbnails).length > 0) {
        setPreviewThumbnails((prev) => ({ ...prev, ...newThumbnails }));
      }
    };

    fetchPreviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPosts.map(p => `${p.id}-${p.media_url}`).join(',')]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule: {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Modular Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
            {daysOfWeek.map((dayName, index) => {
              const post = weekDays[index];
              const date = new Date(weekStart);
              date.setDate(weekStart.getDate() + index);

              if (!post) {
                return <EmptyDayCard key={dayName} date={date} dayName={dayName} />;
              }

              return (
                <PostCard
                  key={post.id || dayName}
                  post={post}
                  date={date}
                  dayName={dayName}
                  previewThumbnail={post.id ? previewThumbnails[post.id] : undefined}
                  onClick={() => onPostClick(post)}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Series Breakdown */}
      {Object.keys(schedule.series_breakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Series Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(schedule.series_breakdown).map(([seriesName, count]) => (
                <div
                  key={seriesName}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  <span className="font-semibold">{seriesName}</span>
                  <span className="text-xs bg-primary/20 px-2 py-0.5 rounded-full">
                    {count} post{count !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
