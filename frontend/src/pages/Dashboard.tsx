import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Link as LinkIcon, Calendar, Loader2, Grid3x3, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyScheduleView } from '@/components/weekly/WeeklyScheduleView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { TrendAlertCard, type TrendAlert } from '@/components/trends/TrendAlertCard';
import { generateWeeklySchedule, getWeeklySchedule, type WeeklySchedule, type WeeklyPost } from '@/lib/weeklyApi';
import { getLatestTrends } from '@/lib/trendsApi';
import { format, startOfWeek, parseISO } from 'date-fns';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountsConnected, setAccountsConnected] = useState(false); // Placeholder
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [trendAlert, setTrendAlert] = useState<TrendAlert | null>(null);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  
  // Auto-refresh schedule every 10 seconds to show real-time updates (faster for preview rendering)
  useEffect(() => {
    if (!currentSchedule) return;
    
    const interval = setInterval(async () => {
      try {
        const monday = getCurrentWeekMonday();
        const schedule = await getWeeklySchedule(format(monday, 'yyyy-MM-dd'));
        setCurrentSchedule(schedule);
      } catch (err: any) {
        // Silently fail on refresh - don't show errors for background updates
        if (err.response?.status !== 404) {
          console.error('Background schedule refresh failed:', err);
        }
      }
    }, 10000); // Refresh every 10 seconds to catch preview updates faster
    
    return () => clearInterval(interval);
  }, [currentSchedule]);

  // Auto-trigger preview rendering for posts without media_url
  useEffect(() => {
    if (!currentSchedule || !currentSchedule.posts) return;
    
    const postsNeedingPreview = currentSchedule.posts.filter(
      post => post.id && !post.media_url && post.shot_plan.length > 0
    );
    
    if (postsNeedingPreview.length === 0) return;
    
    // Trigger preview rendering for posts that need it
    const triggerPreviews = async () => {
      for (const post of postsNeedingPreview) {
        if (!post.id) continue;
        
        try {
          const { renderPostPreview } = await import('@/lib/weeklyApi');
          console.log(`🎬 Triggering preview render for post ${post.id}: ${post.topic}`);
          await renderPostPreview(post.id);
          // Refresh schedule after a short delay to get updated media_url
          setTimeout(async () => {
            try {
              const monday = getCurrentWeekMonday();
              const schedule = await getWeeklySchedule(format(monday, 'yyyy-MM-dd'));
              setCurrentSchedule(schedule);
            } catch (err) {
              console.error('Failed to refresh after preview render:', err);
            }
          }, 3000);
        } catch (err: any) {
          console.error(`❌ Failed to trigger preview for post ${post.id}:`, err);
          // Don't show error to user - just log it
        }
      }
    };
    
    // Wait a bit after schedule generation before triggering renders
    const timeout = setTimeout(triggerPreviews, 2000);
    return () => clearTimeout(timeout);
  }, [currentSchedule?.id]); // Only run when schedule ID changes (new schedule generated)

  // Get current week's Monday
  const getCurrentWeekMonday = () => {
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 }); // Monday = 1
  };

  // Load current week's schedule on mount
  useEffect(() => {
    const loadCurrentWeek = async () => {
      try {
        setIsLoading(true);
        setError(null); // Clear any previous errors
        const monday = getCurrentWeekMonday();
        const schedule = await getWeeklySchedule(format(monday, 'yyyy-MM-dd'));
        setCurrentSchedule(schedule);
      } catch (err: any) {
        // 404 is expected when no schedule exists yet - that's fine
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          // No schedule exists or network error - user can generate one
          setCurrentSchedule(null);
          setError(null); // Don't show error for 404 or network issues
        } else {
          // Actual error occurred
          console.error('Failed to load schedule:', err);
          const errorMessage = err.response?.data?.detail || err.message || 'Failed to load schedule. Please try again.';
          setError(errorMessage);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentWeek();
  }, []);

  // Load trending content on mount
  useEffect(() => {
    const loadTrends = async () => {
      try {
        setIsLoadingTrends(true);
        const trend = await getLatestTrends();
        setTrendAlert(trend);
      } catch (err: any) {
        // Silently fail - trends are optional
        console.log('Trends not available:', err.response?.data?.detail || err.message);
        setTrendAlert(null);
      } finally {
        setIsLoadingTrends(false);
      }
    };

    loadTrends();
  }, []);

  const handleNewPost = () => {
    navigate('/wizard');
  };

  const handleGenerateWeek = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const monday = getCurrentWeekMonday();
      const schedule = await generateWeeklySchedule({
        week_start_date: format(monday, 'yyyy-MM-dd'),
        platforms: ['TikTok', 'Instagram'],
      });
      setCurrentSchedule(schedule);
      setError(null); // Clear any previous errors on success
    } catch (err: any) {
      console.error('Error generating schedule:', err);
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to generate weekly schedule. Please try again.';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePostClick = (post: WeeklyPost) => {
    if (post.id) {
      navigate(`/posts/${post.id}`);
    }
  };

  const handleUseTrendIdea = (trend: TrendAlert) => {
    // Navigate to wizard with trend data in location state
    navigate('/wizard', {
      state: {
        trendIdea: {
          hook_script: trend.hook_script,
          suggested_caption: trend.suggested_caption,
          trend_title: trend.trend_title,
        },
      },
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Social Media Co-Pilot</h1>
          <p className="text-muted-foreground mt-2 text-base">
            Create and manage your weekly content schedule
          </p>
        </div>
        <div className="flex gap-4">
          {!accountsConnected && (
            <Button variant="outline" onClick={() => setAccountsConnected(true)}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Connect Accounts
            </Button>
          )}
          <Button variant="outline" onClick={handleNewPost}>
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Post
          </Button>
        </div>
      </div>

      {/* Trend Alert Card */}
      {trendAlert && (
        <TrendAlertCard trend={trendAlert} onUseIdea={handleUseTrendIdea} />
      )}

      {/* Connect Accounts Info (Placeholder) */}
      {!accountsConnected && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Connect Your Social Accounts</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Connect your TikTok and Instagram accounts via Ayrshare to schedule posts.
                </p>
              </div>
              <Button variant="default" onClick={() => setAccountsConnected(true)}>
                Connect Accounts
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-lg text-red-700 font-medium">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              If this problem continues, check that the backend server is running on port 8000.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Generate Week Button or Schedule View */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Loading schedule...</p>
          </CardContent>
        </Card>
      ) : currentSchedule ? (
        <div className="space-y-8">
          {/* View Mode Toggle */}
          <div className="flex justify-end gap-4">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>
          
          {/* Calendar or List View */}
          {viewMode === 'calendar' ? (
            <CalendarView
              posts={currentSchedule.posts}
              weekStartDate={parseISO(currentSchedule.week_start_date)}
              onPostClick={handlePostClick}
              onWeekChange={(newWeekStart) => {
                // Reload schedule for new week
                const loadWeek = async () => {
                  try {
                    setIsLoading(true);
                    const schedule = await getWeeklySchedule(format(newWeekStart, 'yyyy-MM-dd'));
                    setCurrentSchedule(schedule);
                  } catch (err: any) {
                    if (err.response?.status === 404) {
                      setCurrentSchedule(null);
                    } else {
                      setError(err.response?.data?.detail || 'Failed to load schedule.');
                    }
                  } finally {
                    setIsLoading(false);
                  }
                };
                loadWeek();
              }}
            />
          ) : (
            <WeeklyScheduleView
              schedule={currentSchedule}
              onPostClick={handlePostClick}
            />
          )}
        </div>
      ) : (
        <Card className="text-center">
          <CardHeader className="space-y-4 pb-8">
            <CardTitle className="text-2xl font-bold">
              Generate This Week's Content
            </CardTitle>
            <CardDescription className="text-base">
              Create a complete week of AI-generated posts following TikTok best practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateWeek}
              size="lg"
              disabled={isGenerating}
              className="inline-flex items-center gap-3 px-8 py-6 text-lg font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generating Schedule...
                </>
              ) : (
                <>
                  <Calendar className="w-6 h-6" />
                  Generate This Week
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

