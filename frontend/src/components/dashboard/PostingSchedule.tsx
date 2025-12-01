import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Day {
    day: string;
    date: number;
    isToday: boolean;
}

interface PostingScheduleProps {
    days: Day[];
    onViewFullCalendar: () => void;
}

export const PostingSchedule = ({ days, onViewFullCalendar }: PostingScheduleProps) => {
    return (
        <div className="bg-bg-elevated border border-border-strong rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-bg-action px-12 py-3 flex items-center gap-4">
                <div className="relative shrink-0 w-[42px] h-[42px] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-fg-inverse" />
                </div>
                <h2 className="text-4xl font-bold text-fg-inverse">
                    Posting Schedule
                </h2>
            </div>

            {/* Subheading */}
            <div className="px-12 py-3 flex items-center justify-between border-b border-border-default">
                <p className="text-xl font-medium text-fg-body">
                    Your content plan for the week
                </p>
                <Button
                    variant="ghost"
                    onClick={onViewFullCalendar}
                    className="text-fg-body hover:bg-bg-subtle"
                >
                    View Full Calendar <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
            </div>

            {/* Calendar Grid */}
            <div className="p-12">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {days.map((day, index) => (
                        <div
                            key={index}
                            className={`
                                aspect-[4/5] rounded-xl p-4 border flex flex-col justify-between transition-all cursor-pointer hover:shadow-md
                                ${day.isToday
                                    ? 'bg-bg-action text-fg-inverse border-bg-action'
                                    : 'bg-bg-elevated text-fg-body border-border-default hover:border-border-strong'}
                            `}
                            onClick={onViewFullCalendar}
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
        </div>
    );
};
