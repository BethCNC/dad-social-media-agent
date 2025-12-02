import { Calendar } from "lucide-react";
import { DayThemeCard, type DayThemeCardProps } from "./DayThemeCard";
import { cn } from "@/lib/utils";

export interface PostingScheduleCardProps {
  className?: string;
  description?: string;
}

const DEFAULT_DAY_CONFIG: DayThemeCardProps[] = [
  { day: "Mon", themeTitle: "Motivation", themeSubtitle: "Motivation", variant: "monday" },
  { day: "Tues", themeTitle: "Education", themeSubtitle: "Education", variant: "tuesday" },
  { day: "Wed", themeTitle: "Life Style", themeSubtitle: "Life Style", variant: "wednesday" },
  { day: "Thurs", themeTitle: "Social Proof", themeSubtitle: "Social Proof", variant: "thursday" },
  { day: "Fri", themeTitle: "The Pitch", themeSubtitle: "The Pitch", variant: "friday" },
  { day: "Sat", themeTitle: "Social Life", themeSubtitle: "Social Life", variant: "saturday" },
  { day: "Sun", themeTitle: "Reset", themeSubtitle: "Reset", variant: "sunday" },
];

const DEFAULT_DESCRIPTION = "Use this schedule as a general guide as to what type of content to post each day.";

export function PostingScheduleCard({
  className,
  description = DEFAULT_DESCRIPTION,
}: PostingScheduleCardProps) {
  return (
    <div className={cn("bg-bg-elevated border border-border-strong rounded-xl overflow-hidden w-full shrink-0", className)}>
      {/* Header */}
      <div className="bg-bg-action flex items-center gap-4 px-12 py-3 w-[1200px] shrink-0">
        <div className="relative shrink-0 w-[42px] h-[42px] flex items-center justify-center">
          <Calendar className="w-6 h-6 text-fg-inverse" />
        </div>
        <h2 className="text-4xl text-fg-inverse whitespace-nowrap shrink-0">
          Posting Schedule
        </h2>
      </div>

      {/* Subheading */}
      <div className="flex items-center justify-center px-12 py-3 shrink-0 w-full">
        <p className="text-2xl text-fg-body text-center">
          {description}
        </p>
      </div>

      {/* Calendar Grid */}
      {/* Container padding: p-12 (48px) matches Figma padding/4xl */}
      <div className="p-12 shrink-0 w-full">
        {/* Grid gap: 24px matches Figma gap between day cards - using gap-[24px] for both row and column spacing */}
        <div className="grid grid-cols-4 grid-rows-2 gap-[24px] h-[511px] shrink-0 w-full">
          {/* Grid areas match Figma: [grid-area:1_/_1], [grid-area:1_/_2], etc. */}
          {/* Monday - Row 1, Col 1 */}
          <DayThemeCard {...DEFAULT_DAY_CONFIG[0]} />
          {/* Tuesday - Row 1, Col 2 */}
          <DayThemeCard {...DEFAULT_DAY_CONFIG[1]} />
          {/* Wednesday - Row 1, Col 3 */}
          <DayThemeCard {...DEFAULT_DAY_CONFIG[2]} />
          {/* Thursday - Row 1, Col 4 */}
          <DayThemeCard {...DEFAULT_DAY_CONFIG[3]} />
          {/* Friday - Row 2, Col 1 */}
          <DayThemeCard {...DEFAULT_DAY_CONFIG[4]} />
          {/* Saturday - Row 2, Col 2-3 (spans 2 columns) */}
          <div className="col-span-2">
            <DayThemeCard {...DEFAULT_DAY_CONFIG[5]} />
          </div>
          {/* Sunday - Row 2, Col 4 */}
          <DayThemeCard {...DEFAULT_DAY_CONFIG[6]} />
        </div>
      </div>
    </div>
  );
}

