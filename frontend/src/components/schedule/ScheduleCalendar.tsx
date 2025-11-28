import { type MonthlySchedule, type ScheduledContentItem } from '../../lib/scheduleApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ScheduleCalendarProps {
  schedule: MonthlySchedule;
  onDayClick: (item: ScheduledContentItem) => void;
}

const PILLAR_COLORS: Record<string, string> = {
  education: 'bg-blue-100 border-blue-300 text-blue-800',
  routine: 'bg-green-100 border-green-300 text-green-800',
  story: 'bg-purple-100 border-purple-300 text-purple-800',
  product_integration: 'bg-orange-100 border-orange-300 text-orange-800',
};

const PILLAR_LABELS: Record<string, string> = {
  education: 'Education',
  routine: 'Routine',
  story: 'Story',
  product_integration: 'Product',
};

export const ScheduleCalendar = ({ schedule, onDayClick }: ScheduleCalendarProps) => {
  const startDate = new Date(schedule.start_date);
  const endDate = new Date(schedule.end_date);
  
  // Create a map of date -> item for quick lookup
  const itemsByDate = new Map<string, ScheduledContentItem>();
  schedule.items.forEach((item) => {
    itemsByDate.set(item.date, item);
  });

  // Get first day of month and last day
  const firstDay = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  // Get first day of week (0 = Sunday)
  const startDayOfWeek = firstDay.getDay();
  
  // Generate calendar days
  const calendarDays: (ScheduledContentItem | null)[] = [];
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null);
  }
  
  // Add all days of the month
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), day);
    const dateKey = currentDate.toISOString().split('T')[0];
    const item = itemsByDate.get(dateKey) || null;
    calendarDays.push(item);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Schedule</CardTitle>
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(PILLAR_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={cn('w-4 h-4 rounded border', PILLAR_COLORS[key])} />
              <span className="text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {/* Week day headers */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((item, index) => {
            if (item === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square border border-gray-200 rounded-md bg-gray-50"
                />
              );
            }

            const pillarColor = PILLAR_COLORS[item.content_pillar] || 'bg-gray-100 border-gray-300';
            const dayNumber = new Date(item.date).getDate();

            return (
              <button
                key={item.date}
                onClick={() => onDayClick(item)}
                className={cn(
                  'aspect-square border-2 rounded-md p-2 text-left',
                  'hover:shadow-md transition-shadow cursor-pointer',
                  'flex flex-col gap-1',
                  pillarColor
                )}
                title={item.topic}
              >
                <div className="text-sm font-semibold">{dayNumber}</div>
                {item.series_name && (
                  <div className="text-xs font-medium truncate">
                    {item.series_name}
                  </div>
                )}
                <div className="text-xs truncate">{item.topic}</div>
                <div className="text-xs opacity-75 mt-auto">
                  {PILLAR_LABELS[item.content_pillar] || item.content_pillar}
                </div>
              </button>
            );
          })}
        </div>
        
        {schedule.series_breakdown && Object.keys(schedule.series_breakdown).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h3 className="text-sm font-semibold mb-2">Series Breakdown</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(schedule.series_breakdown).map(([series, count]) => (
                <div key={series} className="text-sm text-muted-foreground">
                  <span className="font-medium">{series}</span>: {count} posts
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

