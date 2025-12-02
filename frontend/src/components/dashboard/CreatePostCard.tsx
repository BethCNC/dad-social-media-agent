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
                        <h2 className="text-3xl font-bold text-fg-headings">
                            Pick Todays Script
                        </h2>
                        <ContextualHelp 
                            content="Start from a bank of ready-made, compliant scripts. Well then walk you through creating the video and downloading it to post with trending audio."
                            className="ml-2"
                        />
                    </div>

                    {/* Suggested Content - Optional, smaller */}
                    {suggestedContent && (
                        <div className="w-full max-w-md">
                            <p className="text-sm text-fg-subtle mb-2 text-center">Suggested script for today:</p>
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
                        Open Content Bank
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
