import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDailyBriefing, type DailyBriefing } from '@/lib/dashboardApi';
import { CreatePostCard } from '@/components/dashboard/CreatePostCard';
import { PostingScheduleCard } from '@/components/weekly/PostingScheduleCard';
import { PostingRules } from '@/components/dashboard/PostingRules';

export const Dashboard = () => {
  console.log('Dashboard component rendering');
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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


  return (
    <div className="min-h-screen bg-bg-page relative">
      <div className="absolute left-1/2 top-[120px] -translate-x-1/2 flex flex-col gap-block-gap items-start w-[1200px]">
        {/* Greeting Container */}
        <div className="flex flex-col gap-0 w-full">
          <h1 className="text-6xl text-fg-headings w-full">{briefing.greeting}</h1>
          <p className="text-3xl text-fg-subtle w-full">{briefing.current_date}</p>
        </div>

        {/* Create Post Card */}
        <CreatePostCard
          suggestedContent={briefing.suggested_action}
          onCreatePost={handleCreatePost}
        />

        {/* Posting Schedule */}
        <PostingScheduleCard />

        {/* Posting Rules */}
        <PostingRules />

      </div>
    </div>
  );
};

