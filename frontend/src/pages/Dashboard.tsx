import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Sparkles, Calendar, TrendingUp, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDailyBriefing, type DailyBriefing, type TrendAlert } from '@/lib/dashboardApi';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load daily briefing on mount
  useEffect(() => {
    const loadBriefing = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getDailyBriefing();
        setBriefing(data);
      } catch (err: any) {
        console.error('Failed to load briefing:', err);
        
        // Better error handling for network issues
        let errorMessage = 'Failed to load your briefing. Please try again.';
        
        if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error') || !err.response) {
          errorMessage = 'Could not connect to the server. Please make sure the backend server is running on port 8000.';
        } else if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadBriefing();
  }, []);

  const handleCreateThisPost = () => {
    // Navigate to wizard with pre-filled prompt from suggested action
    if (briefing?.suggested_action) {
      navigate('/wizard', {
        state: {
          prefillTopic: briefing.suggested_action,
        },
      });
    } else {
      navigate('/wizard');
    }
  };

  const handleUseTrend = (trend: TrendAlert) => {
    // Navigate to wizard with trend data
    navigate('/wizard', {
      state: {
        trendIdea: {
          hook_script: trend.hook_script,
          suggested_caption: trend.suggested_caption,
          trend_title: trend.title,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">Loading your briefing...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-lg text-red-700 font-medium">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!briefing) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{briefing.greeting}</h1>
        <div className="flex items-center gap-4 text-muted-foreground">
          <p className="text-lg">{briefing.current_date}</p>
          {briefing.daily_theme && (
            <>
              <span>•</span>
              <p className="text-lg font-medium">{briefing.daily_theme}</p>
            </>
          )}
        </div>
      </div>

      {/* Hero Card - Today's Mission */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Today's Mission
          </CardTitle>
          <CardDescription className="text-base">
            Your suggested action for today
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-xl font-medium text-foreground">
            {briefing.suggested_action}
          </p>
          <Button
            onClick={handleCreateThisPost}
            size="lg"
            className="w-full sm:w-auto py-6 px-8 text-lg font-semibold"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create This Post
          </Button>
        </CardContent>
      </Card>

      {/* Trend Alert Card */}
      {briefing.trend_alert && (
        <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-600" />
              🔥 Trending Now
            </CardTitle>
            <CardDescription className="text-base">
              {briefing.trend_alert.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-base text-muted-foreground">
              {briefing.trend_alert.why_it_works}
            </p>
            <div className="bg-white/60 rounded-lg p-4 border border-orange-200">
              <p className="text-sm font-semibold text-orange-900 mb-2">Hook Preview:</p>
              <p className="text-sm text-orange-800 italic">
                "{briefing.trend_alert.hook_script.substring(0, 100)}..."
              </p>
            </div>
            <Button
              onClick={() => handleUseTrend(briefing.trend_alert!)}
              variant="default"
              size="lg"
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              Use This Trend
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Holidays */}
      {briefing.upcoming_holidays && briefing.upcoming_holidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Holidays
            </CardTitle>
            <CardDescription>
              Opportunities for seasonal content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {briefing.upcoming_holidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{holiday.name}</p>
                    <p className="text-sm text-muted-foreground">{holiday.date}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate('/wizard', {
                        state: {
                          prefillTopic: `Create content related to ${holiday.name}`,
                        },
                      });
                    }}
                  >
                    Use
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="lg"
              className="h-auto py-6 flex-col items-start"
              onClick={() => navigate('/wizard')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Plus className="w-5 h-5" />
                <span className="text-lg font-semibold">Create Custom Post</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                Start from scratch with your own idea
              </span>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-auto py-6 flex-col items-start"
              onClick={() => navigate('/weekly')}
            >
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                <span className="text-lg font-semibold">View Weekly Schedule</span>
              </div>
              <span className="text-sm text-muted-foreground text-left">
                See your planned posts for the week
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats (Placeholder) */}
      {briefing.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Posts This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{briefing.stats.posts_this_week}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Scheduled Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{briefing.stats.scheduled_posts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Engagement Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {briefing.stats.engagement_rate !== null
                  ? `${briefing.stats.engagement_rate}%`
                  : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
