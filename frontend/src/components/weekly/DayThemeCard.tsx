import { cn } from "@/lib/utils";

type DayColorVariant = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DayThemeCardProps {
  day: string;
  themeTitle: string;
  themeSubtitle: string;
  variant: DayColorVariant;
  className?: string;
}

// Exact hex colors from Figma design (node 21-25658)
const DAY_COLORS: Record<DayColorVariant, { bg: string }> = {
  monday: { bg: "#f26863" },      // Red
  tuesday: { bg: "#ff9233" },     // Orange
  wednesday: { bg: "#ffe270" },   // Yellow
  thursday: { bg: "#4ee07d" },    // Green
  friday: { bg: "#639edf" },      // Blue
  saturday: { bg: "#b176e5" },    // Purple
  sunday: { bg: "#fb88aa" },      // Pink
};

export function DayThemeCard({
  day,
  themeTitle,
  themeSubtitle,
  variant,
  className,
}: DayThemeCardProps) {
  const dayColor = DAY_COLORS[variant];

  return (
    <div
      className={cn(
        // Outer card: p-3 (12px) matches Figma gap/lg, gap-[24px] matches Figma gap/2xl between outer and inner
        // No margin - grid gap handles spacing between cards (24px horizontal and vertical)
        "flex flex-col gap-[24px] h-[310px] min-h-[187px] min-w-[187px] w-full p-3 rounded-lg border border-border-strong m-0 place-self-stretch",
        className
      )}
      style={{
        backgroundColor: dayColor.bg,
      }}
    >
      {/* Inner white container with border */}
      <div
        className="flex-1 bg-[rgba(255,255,255,0.8)] border border-border-strong rounded flex flex-col overflow-hidden"
      >
        {/* Dark header with day abbreviation */}
        {/* py-1 (4px) matches Figma padding/sm, border-b-2 matches Figma border-width/sm */}
        <div className="bg-[#101828] border-b-2 border-border-primary flex items-center justify-center py-1 rounded-t">
          {/* text-4xl (36px), font-extrabold (800), leading-[48px] matches Figma font-size/7, font-weight/extrabold, line-height/7 */}
          <p className="text-4xl font-extrabold leading-[48px] text-white whitespace-nowrap">
            {day}
          </p>
        </div>

        {/* Body with title and subtitle */}
        {/* gap-1 (4px) matches Figma gap/sm, py-2 (8px) matches Figma padding/md, pb-6 (24px) matches Figma gap/2xl */}
        <div className="flex flex-col gap-1 items-center justify-center px-0 py-2 flex-1 pb-6">
          {/* Main title */}
          {/* text-4xl (36px), font-bold (700), leading-[48px] matches Figma font-size/7, font-weight/bold, line-height/7 */}
          <p className="text-4xl font-bold leading-[48px] text-fg-body text-center">
            {themeTitle}
          </p>
          {/* Subtitle */}
          {/* text-xl (20px), font-medium (500), leading-[27px] matches Figma font-size/4, font-weight/medium, line-height/4 */}
          <p className="text-xl font-medium leading-[27px] text-fg-body whitespace-nowrap">
            {themeSubtitle}
          </p>
        </div>
      </div>
    </div>
  );
}


