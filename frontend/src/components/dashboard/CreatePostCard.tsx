import { Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ContextualHelp } from './ContextualHelp';

interface CreatePostCardProps {
    suggestedContent: string;
    onCreatePost: () => void;
}

export const CreatePostCard = ({ suggestedContent, onCreatePost }: CreatePostCardProps) => {
    return (
        <Card className="bg-bg-elevated border-2 border-border-strong">
            <CardContent className="p-8">
                <div className="flex flex-col items-center gap-6">
                    {/* Header with help icon */}
                    <div className="flex items-center gap-3 w-full justify-center">
                        <Sparkles className="w-8 h-8 text-bg-action" />
                        <h2 className="text-3xl font-semibold tracking-tight text-fg-headings">
                            Create Post for Today
                        </h2>
                        <ContextualHelp
                            content="Simple 4-step process: 1) Enter your topic 2) Review AI-generated script 3) Choose visuals 4) Download video. Then post to TikTok/Instagram with trending audio."
                            className="ml-2"
                        />
                    </div>

                    {/* Suggested Content - Optional, smaller */}
                    {suggestedContent && (
                        <div className="w-full max-w-md">
                            <p className="text-sm text-fg-subtle mb-2 text-center">Suggested topic for today:</p>
                            <p className="text-base text-fg-body text-center bg-bg-subtle border border-border-default rounded-lg p-3">
                                {suggestedContent}
                            </p>
                        </div>
                    )}

                    {/* Primary CTA Button */}
                    <Button
                        onClick={onCreatePost}
                        size="lg"
                        className="w-full max-w-md h-16 text-xl font-semibold gap-3"
                    >
                        <Plus className="w-6 h-6" />
                        Start Creating
                    </Button>

                    {/* Quick Flow Overview */}
                    <div className="text-center text-sm text-fg-subtle max-w-lg">
                        <p>Create → Download → Open TikTok/Instagram → Upload → Add Trending Audio → Post</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
