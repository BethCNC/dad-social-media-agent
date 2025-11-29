import { useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type WeeklyPost } from '@/lib/weeklyApi';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  posts: WeeklyPost[];
  weekStartDate: Date;
  onPostClick?: (post: WeeklyPost) => void;
  onWeekChange?: (newWeekStart: Date) => void;
}

export const CalendarView = ({ posts, weekStartDate, onPostClick, onWeekChange }: CalendarViewProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(weekStartDate, { weekStartsOn: 1 }));
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  
  const weekDaysShort = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekDaysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const handlePreviousWeek = () => {
    const newWeek = subWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const handleNextWeek = () => {
    const newWeek = addWeeks(currentWeekStart, 1);
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const handleToday = () => {
    const today = new Date();
    const newWeek = startOfWeek(today, { weekStartsOn: 1 });
    setCurrentWeekStart(newWeek);
    onWeekChange?.(newWeek);
  };
  
  const getPostsForDay = (day: Date): WeeklyPost[] => {
    return posts.filter(post => {
      const postDate = new Date(post.post_date);
      return isSameDay(postDate, day);
    });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'ready':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <CalendarIcon className="w-6 h-6" />
            {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'd, yyyy')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {weekDaysShort.map((day, index) => (
            <div
              key={day}
              className="text-center font-semibold text-sm text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
          
          {/* Day cells */}
          {weekDays.map((day, index) => {
            const dayPosts = getPostsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[120px] border rounded-lg p-2",
                  isToday && "border-primary border-2 bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-2",
                  isToday && "text-primary font-bold"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {dayPosts.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => onPostClick?.(post)}
                      className={cn(
                        "w-full text-left text-xs p-1.5 rounded border transition-colors hover:shadow-sm",
                        getStatusColor(post.status),
                        "truncate"
                      )}
                      title={`${post.topic} - ${post.status}`}
                    >
                      <div className="font-medium truncate">{post.topic}</div>
                      {post.post_time && (
                        <div className="text-xs opacity-75">
                          {format(new Date(`2000-01-01T${post.post_time}`), 'h:mm a')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-gray-100 border-gray-300" />
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-yellow-100 border-yellow-300" />
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-blue-100 border-blue-300" />
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border bg-green-100 border-green-300" />
            <span>Published</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

