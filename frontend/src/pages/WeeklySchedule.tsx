import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Loader2, CalendarDays, Grid3x3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WeeklyScheduleView } from '@/components/weekly/WeeklyScheduleView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { generateWeeklySchedule, getWeeklySchedule, type WeeklySchedule, type WeeklyPost } from '@/lib/weeklyApi';
import { format, startOfWeek, parseISO } from 'date-fns';

export const WeeklySchedulePage = () => {
  const navigate = useNavigate();
  const [currentSchedule, setCurrentSchedule] = useState<WeeklySchedule | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');

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
        setError(null);
        const monday = getCurrentWeekMonday();
        const schedule = await getWeeklySchedule(format(monday, 'yyyy-MM-dd'));
        setCurrentSchedule(schedule);
      } catch (err: any) {
        // 404 is expected when no schedule exists yet - that's fine
        if (err.response?.status === 404 || err.code === 'ERR_NETWORK') {
          setCurrentSchedule(null);
          setError(null);
        } else {
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
      setError(null);
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
      navigate(`/posts/${post.id}`, { state: { from: '/weekly' } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Weekly Schedule</h1>
          <p className="text-fg-subtle mt-2 text-base">
            Plan and manage your weekly content schedule
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" onClick={handleNewPost}>
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Post
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-border-error bg-bg-error-subtle">
          <CardContent className="pt-6">
            <p className="text-lg text-fg-error font-medium">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Generate Week Button or Schedule View */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-fg-subtle text-lg">Loading schedule...</p>
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
                  <CalendarDays className="w-6 h-6" />
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

