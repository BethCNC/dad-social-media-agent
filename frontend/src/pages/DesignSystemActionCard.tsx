import { Video, TrendingUp, Shield, Plus } from "lucide-react";
import { ActionCard } from "@/components/ui/action-card";

export function DesignSystemActionCardPage() {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-7xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-fg-headings">Action Card Component</h1>
        <p className="text-sm text-fg-subtle">
          Reusable action card component with icon, title, description, and optional actions.
        </p>
      </header>

      {/* Default Variant */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-headings">Default Variant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            icon={Video}
            title="Video Library"
            description="Manage your uploaded assets"
            showArrow
            onAction={() => console.log("Navigate to videos")}
          />
          <ActionCard
            icon={TrendingUp}
            title="Content Inspiration"
            description="See what's trending today"
            showArrow
            onAction={() => console.log("Show trends")}
          />
        </div>
      </section>

      {/* Elevated Variant */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-headings">Elevated Variant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            icon={Shield}
            title="Compliance & Brand Guidelines"
            description="Review posting rules and guidelines"
            variant="elevated"
            showArrow
            onAction={() => console.log("Show compliance")}
          />
        </div>
      </section>

      {/* Action Variant */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-headings">Action Variant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard
            icon={Plus}
            title="Create New Post"
            description="Start creating your next social media post"
            variant="action"
            actionLabel="Get Started"
            onAction={() => console.log("Create post")}
          />
        </div>
      </section>

      {/* With Custom Content */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-fg-headings">With Custom Content</h2>
        <ActionCard
          icon={Video}
          title="Video Library"
          description="Manage your uploaded assets"
          onAction={() => console.log("Navigate")}
        >
          <div className="space-y-2">
            <p className="text-sm text-fg-body">Custom content can be added here</p>
            <ul className="list-disc list-inside text-sm text-fg-subtle space-y-1">
              <li>Upload new videos</li>
              <li>Organize your library</li>
              <li>Preview assets</li>
            </ul>
          </div>
        </ActionCard>
      </section>
    </div>
  );
}


