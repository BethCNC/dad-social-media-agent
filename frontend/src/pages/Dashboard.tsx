import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getDailyBriefing, type DailyBriefing } from '@/lib/dashboardApi';
import { CreatePostCard } from '@/components/dashboard/CreatePostCard';
import { PostingScheduleCard } from '@/components/weekly/PostingScheduleCard';
import { PostingRules } from '@/components/dashboard/PostingRules';
import { QuickHelp } from '@/components/dashboard/QuickHelp';
import { CollapsibleSection } from '@/components/dashboard/CollapsibleSection';
import { ContextualHelp } from '@/components/dashboard/ContextualHelp';
import { CalendarDays, Video, Clock, Calendar, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getWeeklySchedule } from '@/lib/weeklyApi';
import { format, startOfWeek } from 'date-fns';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [todayPostCount, setTodayPostCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch daily briefing
        const briefingData = await getDailyBriefing();
        setBriefing(briefingData);
        
        // Check for weekly schedule and today's posts
        try {
          const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
          const schedule = await getWeeklySchedule(format(monday, 'yyyy-MM-dd'));
          
          // Count posts for today
          const today = new Date();
          const todayStr = format(today, 'yyyy-MM-dd');
          const todayPosts = schedule.posts.filter(post => 
            post.post_date && post.post_date.startsWith(todayStr)
          );
          setTodayPostCount(todayPosts.length);
        } catch (scheduleError: any) {
          // 404 is expected when no schedule exists - that's fine
          if (scheduleError.response?.status !== 404) {
            console.error('Failed to fetch weekly schedule:', scheduleError);
          }
          setTodayPostCount(0);
        }
      } catch (error) {
        console.error('Failed to fetch briefing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreatePost = () => {
    // Primary flow: take user directly to post creation wizard
    navigate('/wizard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border-primary mx-auto"></div>
          <p className="text-fg-subtle">Loading...</p>
        </div>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-page">
        <p className="text-fg-subtle">Unable to load data</p>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-bg-page">
      <div className="flex flex-col gap-6 max-w-4xl mx-auto">
        {/* Greeting Container - Smaller, less prominent */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold text-fg-headings">{briefing.greeting}</h1>
          <p className="text-lg text-fg-subtle">{briefing.current_date}</p>
        </div>

        {/* Content Bank entry point */}
        <CreatePostCard
          suggestedContent={briefing.suggested_action}
          onCreatePost={handleCreatePost}
        />

        {/* Quick Actions Row */}
        <div className="flex items-center justify-center gap-4 w-full flex-wrap">
          <div className="flex items-center gap-2">
            <Link to="/weekly">
              <Button variant="outline" size="lg" className="gap-3">
                <CalendarDays className="w-5 h-5" />
                <span className="text-lg">Plan This Week</span>
              </Button>
            </Link>
            <ContextualHelp 
              content="Generate a week of content ideas. Download videos individually and post manually with trending audio."
            />
          </div>
          
          <Link to="/videos">
            <Button variant="outline" size="lg" className="gap-3">
              <Video className="w-5 h-5" />
              <span className="text-lg">View Video Library</span>
            </Button>
          </Link>
          
          {todayPostCount > 0 && (
            <Link to="/weekly">
              <Button variant="outline" size="lg" className="gap-3">
                <Clock className="w-5 h-5" />
                <span className="text-lg">
                  Today's Posts {todayPostCount > 1 ? `(${todayPostCount})` : ''}
                </span>
              </Button>
            </Link>
          )}
        </div>

        {/* Collapsible Help Section */}
        <QuickHelp />

        {/* Collapsible Posting Schedule */}
        <CollapsibleSection 
          title="Weekly Theme Guide" 
          icon={<Calendar className="w-5 h-5 text-fg-subtle" />}
        >
          <PostingScheduleCard />
        </CollapsibleSection>

        {/* Collapsible Posting Rules */}
        <CollapsibleSection 
          title="Posting Rules & Compliance" 
          icon={<Shield className="w-5 h-5 text-fg-subtle" />}
        >
          <PostingRules />
        </CollapsibleSection>

      </div>
    </div>
  );
};

