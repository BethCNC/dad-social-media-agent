import { Sparkles, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreatePostCardProps {
    suggestedContent: string;
    onCreatePost: () => void;
}

export const CreatePostCard = ({ suggestedContent, onCreatePost }: CreatePostCardProps) => {
    return (
        <div
            className="bg-bg-elevated rounded-xl p-8 border border-border-strong relative overflow-hidden"
            data-name="Create Post Card"
        >
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                {/* Left Content Section */}
                <div className="flex flex-col gap-6 max-w-2xl w-full">
                    {/* Card Header */}
                    <div className="flex items-center gap-4" data-name="card header">
                        {/* Icon Container */}
                        <div className="relative shrink-0 w-[42px] h-[42px] bg-bg-action rounded-lg flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-fg-inverse" />
                        </div>

                        {/* Title */}
                        <h2 className="text-4xl font-bold text-fg-headings">
                            Create Your Next Post
                        </h2>
                    </div>

                    {/* Suggested Content Container */}
                    <div
                        className="bg-bg-page rounded-lg p-6 border border-border-default flex flex-col gap-3"
                        data-name="Suggested Content Container"
                    >
                        {/* Title */}
                        <div className="flex gap-1 items-start w-full" data-name="title">
                            <p className="text-2xl font-semibold text-fg-body">
                                Suggested Content for Today:
                            </p>
                        </div>

                        {/* Copy */}
                        <div className="flex gap-3 items-center justify-center w-full" data-name="copy">
                            <p className="text-lg font-normal text-fg-body text-center flex-grow">
                                {suggestedContent}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Button */}
                <Button
                    onClick={onCreatePost}
                    className="h-16 px-8 bg-bg-action hover:bg-gray-800 text-fg-inverse text-xl font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-3 shrink-0"
                >
                    <Plus className="w-6 h-6" />
                    Create New Post
                </Button>
            </div>
        </div>
    );
};
