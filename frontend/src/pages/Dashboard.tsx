import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Video, TrendingUp, Shield, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border-primary mx-auto"></div>
          <p className="text-fg-subtle">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page">
        <p className="text-fg-subtle">Unable to load dashboard</p>
      </div>
    );
  }

  // Helper to generate next 7 days for the calendar view
  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: date.getDate(),
        isToday: i === 0
      });
    }
    return days;
  };

  const next7Days = getNext7Days();

  return (
    <div className="min-h-screen bg-bg-page px-8 py-12">
      <div className="max-w-[1200px] mx-auto space-y-16">

        {/* Greeting Container */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-fg-headings tracking-tight">{briefing.greeting}</h1>
          <p className="text-3xl font-medium text-fg-subtle">{briefing.current_date}</p>
        </div>

        {/* Create Post Card */}
        <div className="bg-bg-elevated rounded-xl p-8 border border-border-default shadow-sm relative overflow-hidden group">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-6 max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-bg-action rounded-lg">
                  <Sparkles className="w-8 h-8 text-fg-inverse" />
                </div>
                <h2 className="text-4xl font-bold text-fg-headings">Create Your Next Post</h2>
              </div>

              {/* Suggested Content Container */}
              <div className="bg-bg-page rounded-lg p-6 border border-border-default">
                <p className="text-2xl font-semibold text-fg-headings mb-2">Suggested Content for Today:</p>
                <p className="text-lg text-fg-body">{briefing.suggested_action}</p>
              </div>
            </div>

            <Button
              onClick={handleCreatePost}
              className="h-16 px-8 bg-bg-action hover:bg-gray-800 text-fg-inverse text-xl font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 shrink-0"
            >
              <Plus className="w-6 h-6" />
              Create Post Now
            </Button>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-4xl font-bold text-fg-headings">Weekly Schedule</h2>
              <p className="text-xl text-fg-subtle">Your content plan for the week</p>
            </div>
            <Button variant="outline" onClick={handleWeeklySchedule} className="text-fg-body border-border-strong hover:bg-bg-subtle">
              View Full Calendar <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {next7Days.map((day, index) => (
              <div
                key={index}
                className={`
                  aspect-[4/5] rounded-xl p-4 border flex flex-col justify-between transition-all cursor-pointer hover:shadow-md
                  ${day.isToday
                    ? 'bg-bg-action text-fg-inverse border-bg-action'
                    : 'bg-bg-elevated text-fg-body border-border-default hover:border-border-strong'}
                `}
                onClick={handleWeeklySchedule}
              >
                <div className="text-center">
                  <p className={`text-sm font-medium uppercase tracking-wider ${day.isToday ? 'text-gray-400' : 'text-fg-subtle'}`}>
                    {day.day}
                  </p>
                  <p className="text-3xl font-bold mt-1">{day.date}</p>
                </div>

                <div className="flex justify-center">
                  {/* Placeholder for content indicator */}
                  <div className={`w-2 h-2 rounded-full ${day.isToday ? 'bg-green-500' : 'bg-border-default'}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Video Library */}
          <Card className="bg-bg-elevated border-border-default hover:border-border-strong transition-all cursor-pointer group" onClick={() => navigate('/videos')}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Video className="w-10 h-10 text-fg-headings" />
                <ArrowRight className="w-6 h-6 text-fg-subtle group-hover:translate-x-1 transition-transform" />
              </div>
              <CardTitle className="text-2xl font-bold text-fg-headings">Video Library</CardTitle>
              <CardDescription className="text-lg text-fg-subtle">Manage your uploaded assets</CardDescription>
            </CardHeader>
          </Card>

          {/* Trends */}
          <Card className="bg-bg-elevated border-border-default hover:border-border-strong transition-all cursor-pointer group" onClick={() => setShowTrends(!showTrends)}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-10 h-10 text-fg-headings" />
                {showTrends ? <ChevronUp className="w-6 h-6 text-fg-subtle" /> : <ChevronDown className="w-6 h-6 text-fg-subtle group-hover:translate-y-1 transition-transform" />}
              </div>
              <CardTitle className="text-2xl font-bold text-fg-headings">Content Inspiration</CardTitle>
              <CardDescription className="text-lg text-fg-subtle">
                {briefing.trend_pulse ? `${briefing.trend_pulse.new_viral_trends} new trends today` : 'See what\'s trending'}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Expandable Trends Section */}
        {showTrends && briefing.trend_pulse && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <SocialTrendsPulse
              data={briefing.trend_pulse}
              onTrendClick={(trend) => {
                navigate('/wizard', { state: { prefillTopic: trend.name } });
              }}
            />
          </div>
        )}

        {/* Compliance Section */}
        <Card
          className="bg-bg-warning-subtle border-border-warning cursor-pointer"
          onClick={() => setShowCompliance(!showCompliance)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Shield className="w-8 h-8 text-fg-warning" />
                <CardTitle className="text-2xl font-bold text-fg-headings">Compliance & Brand Guidelines</CardTitle>
              </div>
              {showCompliance ? <ChevronUp className="w-6 h-6 text-fg-subtle" /> : <ChevronDown className="w-6 h-6 text-fg-subtle" />}
            </div>
          </CardHeader>
          {showCompliance && (
            <CardContent className="space-y-6 animate-in slide-in-from-top-4 duration-300 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border-warning/30">
                <div className="space-y-3">
                  <p className="font-bold text-fg-success-hover uppercase tracking-wide">✅ Always Include:</p>
                  <ul className="space-y-2 text-fg-body">
                    <li>• Hashtags: #metabolichealth #healthyliving</li>
                    <li>• "Link in bio" (never direct URLs)</li>
                    <li>• Health disclaimer at end</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <p className="font-bold text-fg-error uppercase tracking-wide">❌ Never Say:</p>
                  <ul className="space-y-2 text-fg-body">
                    <li>• "Cures", "treats", "fixes" diseases</li>
                    <li>• "Make $X" or income promises</li>
                    <li>• "Join my team" (MLM banned on TikTok)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

      </div>
    </div>
  );
};
