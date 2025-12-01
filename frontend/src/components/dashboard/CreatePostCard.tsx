import { Sparkles, Plus } from 'lucide-react';

interface CreatePostCardProps {
    suggestedContent: string;
    onCreatePost: () => void;
}

export const CreatePostCard = ({ suggestedContent, onCreatePost }: CreatePostCardProps) => {
    return (
        <div className="bg-bg-elevated border border-border-strong rounded-xl overflow-hidden w-full shrink-0">
            {/* Card Header */}
            <div className="bg-bg-action flex items-center gap-4 px-12 py-3 w-[1200px] shrink-0">
                <div className="relative shrink-0 w-[42px] h-[42px] flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-fg-inverse" />
                </div>
                <h2 className="text-4xl text-fg-inverse whitespace-nowrap shrink-0">
                    Create Your Next Post
                </h2>
            </div>

            {/* Main Content */}
            <div className="flex gap-6 items-start p-12 shrink-0 w-full">
                {/* Left: Subtitle */}
                <div className="flex items-center justify-center w-[395px] shrink-0">
                    <p className="text-xl text-fg-body">
                        Generate AI-powered social content that follows Unicity guidelines and Maximizes engagement in under 5 minutes.
                    </p>
                </div>

                {/* Right: Suggested Content and Button */}
                <div className="flex-1 flex flex-col gap-6 min-w-0 grow shrink-0">
                    {/* Suggested Content Container */}
                    <div className="bg-bg-subtle border border-border-strong rounded flex flex-col gap-2 px-6 py-3 shrink-0 w-full">
                        <p className="text-2xl text-fg-body whitespace-nowrap shrink-0">
                            Suggested Content for Today:
                        </p>
                        <p className="text-lg text-fg-body text-center shrink-0">
                            {suggestedContent}
                        </p>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={onCreatePost}
                        className="bg-bg-action border-2 border-border-primary rounded flex items-center justify-center gap-4 px-6 py-3 shrink-0 w-full"
                    >
                        <Plus className="w-7 h-7 text-white shrink-0" />
                        <span className="text-xl font-semibold text-white text-center whitespace-nowrap shrink-0">
                            Create New Post
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};
