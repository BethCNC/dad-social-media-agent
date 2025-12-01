import { DayThemeCard } from "@/components/weekly/DayThemeCard";
import { PostingScheduleCard } from "@/components/weekly/PostingScheduleCard";

const DAY_CONFIG = [
  { day: "Mon", themeTitle: "Motivation", themeSubtitle: "Motivation", variant: "monday" as const },
  { day: "Tues", themeTitle: "Education", themeSubtitle: "Education", variant: "tuesday" as const },
  { day: "Wed", themeTitle: "Life Style", themeSubtitle: "Life Style", variant: "wednesday" as const },
  { day: "Thurs", themeTitle: "Social Proof", themeSubtitle: "Social Proof", variant: "thursday" as const },
  { day: "Fri", themeTitle: "The Pitch", themeSubtitle: "The Pitch", variant: "friday" as const },
  { day: "Sat", themeTitle: "Social Life", themeSubtitle: "Social Life", variant: "saturday" as const },
  { day: "Sun", themeTitle: "Reset", themeSubtitle: "Reset", variant: "sunday" as const },
];

export function DesignSystemDayCardsPage() {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-fg-headings">Posting Schedule Components</h1>
        <p className="text-sm text-fg-subtle">
          Weekly posting schedule cards and container, matching the Figma "Posting Schedule" section.
        </p>
      </header>

      {/* Full Posting Schedule Card (Container) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-headings">Posting Schedule Card (Container)</h2>
        <PostingScheduleCard />
      </section>

      {/* Individual Day Cards (Standalone) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-headings">Individual Day Cards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          {DAY_CONFIG.map((dayConfig) => (
            <DayThemeCard key={dayConfig.day} {...dayConfig} />
          ))}
        </div>
      </section>
    </div>
  );
}


