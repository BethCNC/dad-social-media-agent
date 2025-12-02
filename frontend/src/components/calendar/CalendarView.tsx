import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type WeeklyPost } from '@/lib/weeklyApi';
import { PostMockup } from './PostMockup';
import { cn } from '@/lib/utils';
import { searchAssetsContextual } from '@/lib/assetsApi';

interface CalendarViewProps {
  posts: WeeklyPost[];
  weekStartDate: Date;
  onPostClick?: (post: WeeklyPost) => void;
  onWeekChange?: (newWeekStart: Date) => void;
}

export const CalendarView = ({ posts, weekStartDate, onPostClick, onWeekChange }: CalendarViewProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(weekStartDate, { weekStartsOn: 1 }));
  const [previewThumbnails, setPreviewThumbnails] = useState<Record<number, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Record<number, boolean>>({});
  
  // Update when weekStartDate prop changes (for real-time updates)
  useEffect(() => {
    setCurrentWeekStart(startOfWeek(weekStartDate, { weekStartsOn: 1 }));
  }, [weekStartDate]);

  // Fetch preview thumbnails for posts without rendered media
  useEffect(() => {
    const fetchPreviews = async () => {
      const postsToFetch = posts.filter(
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
            }
          } catch (error) {
            console.error(`Failed to fetch preview for post ${post.id}:`, error);
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
  }, [posts.map(p => `${p.id}-${p.media_url}`).join(',')]);
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const handlePreviousWeek = () => {
    const newWeek = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const handleNextWeek = () => {
    const newWeek = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const handleToday = () => {
    const today = new Date();
    const newWeek = startOfWeek(today, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const getPostsForDay = (day: Date): WeeklyPost[] => {
    return posts.filter(post => {
      const postDate = new Date(post.post_date);
      return isSameDay(postDate, day);
    });
  };
  
  // Determine platform for a post (default to TikTok)
  const getPlatform = (_post: WeeklyPost): 'tiktok' | 'instagram' => {
    // For now, default to TikTok. In the future, this could be determined from schedule.platforms
    // or a post.platforms field if added
    return 'tiktok';
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'd, yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Responsive grid: 1 column mobile, 2 tablet, 3-4 desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {weekDays.map((day, index) => {
            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            const dayName = weekDaysShort[index];
            
            // If no posts for this day, show empty state
            if (dayPosts.length === 0) {
              return (
                <Card
                  key={day.toISOString()}
                  className={cn(
                    "border-2 border-dashed min-h-[600px]",
                    isToday && "border-primary"
                  )}
                >
                  <CardContent className="flex flex-col items-center justify-center h-full min-h-[600px] p-8">
                    <div className="text-center space-y-2">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {dayName}
                      </div>
                      <div className={cn(
                        "text-lg font-bold",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'MMM d')}
                      </div>
                      <div className="text-sm text-muted-foreground mt-4">
                        No post scheduled
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            // Show first post for the day (calendar typically shows one post per day)
            const post = dayPosts[0];
            const thumbnailUrl = post.id ? previewThumbnails[post.id] : undefined;
            const platform = getPlatform(post);
            
            return (
              <Card
                key={day.toISOString()}
                className={cn(
                  "border-2 min-h-[600px] cursor-pointer transition-all hover:shadow-lg",
                  isToday && "border-primary border-2 bg-primary/5"
                )}
                onClick={() => onPostClick?.(post)}
              >
                <CardContent className="p-4 space-y-4">
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {dayName}
                      </div>
                      <div className={cn(
                        "text-lg font-bold",
                        isToday && "text-primary"
                      )}>
                        {format(day, 'MMM d')}
                      </div>
                    </div>
                <div className={cn(
                      "px-2 py-1 rounded-full text-xs font-semibold",
                      post.status === 'published' && 'bg-green-100 text-green-800',
                      post.status === 'scheduled' && 'bg-blue-100 text-blue-800',
                      post.status === 'ready' && 'bg-yellow-100 text-yellow-800',
                      post.status === 'draft' && 'bg-gray-100 text-gray-800'
                    )}>
                      {post.status}
                    </div>
                  </div>

                  {/* Post Mockup */}
                  <div className="flex justify-center">
                    <PostMockup
                      mediaUrl={post.media_url || undefined}
                      thumbnailUrl={thumbnailUrl}
                      caption={post.caption}
                      username="@username"
                      templateType={post.template_type as 'image' | 'video'}
                      platform={platform}
                      status={post.status}
                    />
                </div>
                
                  {/* Post Info */}
                  <div className="space-y-2 pt-4 border-t">
                    {post.series_name && (
                      <div className="text-xs font-semibold text-muted-foreground">
                        {post.series_name}
                      </div>
                    )}
                    <div className="text-sm font-semibold line-clamp-2">
                      {post.topic}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {post.hook}
                    </div>
                      {post.post_time && (
                      <div className="text-xs text-muted-foreground">
                          {format(new Date(`2000-01-01T${post.post_time}`), 'h:mm a')}
                        </div>
                      )}
                </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-gray-100 border-gray-300" />
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-yellow-100 border-yellow-300" />
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-blue-100 border-blue-300" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-green-100 border-green-300" />
            <span>Published</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

