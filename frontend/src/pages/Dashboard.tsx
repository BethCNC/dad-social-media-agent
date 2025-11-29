import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Calendar, Video, TrendingUp, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDailyBriefing, type DailyBriefing } from '@/lib/dashboardApi';
import { SocialTrendsPulse } from '@/components/trends/SocialTrendsPulse';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showTrends, setShowTrends] = useState(false);
  const [showCompliance, setShowCompliance] = useState(false);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const data = await getDailyBriefing();
        setBriefing(data);
      } catch (error) {
        console.error('Failed to fetch briefing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBriefing();
  }, []);

  const handleCreatePost = () => {
    navigate('/wizard');
  };

  const handleWeeklySchedule = () => {
    navigate('/weekly');
  };

  const handleVideoLibrary = () => {
    navigate('/videos');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Unable to load dashboard</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">{briefing.greeting}</h1>
        <p className="text-lg text-muted-foreground">{briefing.current_date}</p>
      </div>

      {/* Hero CTA - Primary Action */}
      <Card className="border-2 border-primary shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-primary" />
                <h2 className="text-3xl font-bold">Create Your Next Post</h2>
              </div>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Generate AI-powered social content that follows Unicity guidelines and maximizes engagement in under 5 minutes.
              </p>
              {briefing.suggested_action && (
                <div className="bg-background/80 rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground mb-1">Suggested Today:</p>
                  <p className="font-medium">{briefing.suggested_action}</p>
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <Button
                onClick={handleCreatePost}
                size="lg"
                className="h-16 px-12 text-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Plus className="w-6 h-6 mr-3" />
                Create Post Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions - Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Schedule */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleWeeklySchedule}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Calendar className="w-10 h-10 text-primary" />
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:translate-y-1 transition-transform" />
            </div>
            <CardTitle className="text-xl">Weekly Schedule</CardTitle>
            <CardDescription>
              Generate or view your 7-day content plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {briefing.stats.scheduled_posts > 0
                ? `${briefing.stats.scheduled_posts} posts scheduled`
                : 'No posts scheduled yet'}
            </p>
          </CardContent>
        </Card>

        {/* Video Library */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={handleVideoLibrary}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Video className="w-10 h-10 text-primary" />
              <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:translate-y-1 transition-transform" />
            </div>
            <CardTitle className="text-xl">Video Library</CardTitle>
            <CardDescription>
              Upload videos to use in your posts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage your uploaded assets
            </p>
          </CardContent>
        </Card>

        {/* View Trends */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => setShowTrends(!showTrends)}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <TrendingUp className="w-10 h-10 text-primary" />
              {showTrends ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground group-hover:translate-y-1 transition-transform" />
              )}
            </div>
            <CardTitle className="text-xl">Content Inspiration</CardTitle>
            <CardDescription>
              See what's trending in your niche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {briefing.trend_pulse
                ? `${briefing.trend_pulse.new_viral_trends} new trends today`
                : 'Click to view trends'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Sections */}

      {/* Social Trends Pulse - Expandable */}
      {showTrends && briefing.trend_pulse && (
        <div className="animate-in slide-in-from-top-4 duration-300">
          <SocialTrendsPulse
            data={briefing.trend_pulse}
            onTrendClick={(trend) => {
              navigate('/wizard', {
                state: {
                  prefillTopic: trend.name,
                },
              });
            }}
          />
        </div>
      )}

      {/* Compliance Quick Reference - Collapsible */}
      <Card
        className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 cursor-pointer"
        onClick={() => setShowCompliance(!showCompliance)}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-orange-600" />
              <CardTitle className="text-xl">Compliance & Brand Guidelines</CardTitle>
            </div>
            {showCompliance ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
          {!showCompliance && (
            <CardDescription>
              Click to view important rules to keep your account safe
            </CardDescription>
          )}
        </CardHeader>
        {showCompliance && (
          <CardContent className="space-y-4 animate-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Critical DO's */}
              <div className="space-y-2">
                <p className="font-semibold text-green-900 text-sm uppercase tracking-wide">✅ Always Include:</p>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>• Hashtags: #metabolichealth #healthyliving #unicity</li>
                  <li>• "Link in bio" (never direct URLs)</li>
                  <li>• Health disclaimer at end</li>
                  <li>• "Supports", "helps with" language</li>
                </ul>
              </div>
              {/* Critical DON'Ts */}
              <div className="space-y-2">
                <p className="font-semibold text-red-900 text-sm uppercase tracking-wide">❌ Never Say:</p>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>• "Cures", "treats", "fixes" diseases</li>
                  <li>• "Make $X" or income promises</li>
                  <li>• "Join my team" (MLM banned on TikTok)</li>
                  <li>• Direct URLs in captions</li>
                </ul>
              </div>
            </div>
            <div className="pt-3 border-t border-orange-200">
              <p className="text-xs text-orange-700 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                All generated content automatically follows these rules
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Upcoming Holidays - Compact */}
      {briefing.upcoming_holidays && briefing.upcoming_holidays.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Upcoming Holiday Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {briefing.upcoming_holidays.slice(0, 3).map((holiday, index) => (
                <div
                  key={index}
                  className="bg-white/80 rounded-lg px-4 py-2 border border-blue-200"
                >
                  <p className="font-medium text-sm text-blue-900">{holiday.name}</p>
                  <p className="text-xs text-blue-600">{holiday.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
