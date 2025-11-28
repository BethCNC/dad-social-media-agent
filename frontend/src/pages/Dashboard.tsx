import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Dashboard = () => {
  const navigate = useNavigate();

  const handleNewPost = () => {
    navigate('/wizard');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <Card className="text-center">
        <CardHeader className="space-y-4 pb-8">
          <CardTitle className="text-4xl font-bold">
            Welcome to Your Social Media Co-Pilot
          </CardTitle>
          <CardDescription className="text-xl">
            Create engaging TikTok and Instagram content with AI assistance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleNewPost}
            size="lg"
            className="inline-flex items-center gap-3 px-8 py-6 text-lg font-semibold"
            aria-label="Create a new social media post"
          >
            <Plus className="w-6 h-6" aria-hidden="true" />
            Create New Post
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

