import { Link, useLocation } from "react-router-dom";
import { Home, Video, Plus, Calendar } from "lucide-react";

import { cn } from "@/lib/utils";
import { NavTabs, NavTabItem } from "@/components/ui/nav-tabs";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/weekly", label: "Weekly Schedule", icon: Calendar },
  { path: "/videos", label: "Video Library", icon: Video },
  { path: "/wizard", label: "New Post", icon: Plus },
];

export const NavBar = () => {
  const location = useLocation();

  return (
    <header className="bg-bg-subtle border border-border-default rounded sticky top-0 z-50">
      {/* Main container - p-6 (24px) padding all around from Figma padding/2xl */}
      <div className="flex items-center p-6 w-full">
        {/* Logo and name section - gap-2 (8px from gap/md), pl-0 pr-3 (12px), py-0 */}
        <div className="flex items-center gap-2 pl-0 pr-3 py-0">
          {/* Logo container - p-[6px] with bg-secondary */}
          <div className="p-[6px] bg-bg-secondary rounded">
            <img
              src="/logo.png"
              alt="Unicity Social Agent"
              className="h-6 w-6"
            />
          </div>
          {/* App name - text-lg (18px), font-bold (700), leading-6 (24px), text-fg-subtle */}
          <span className="text-lg font-bold text-fg-subtle whitespace-nowrap">
            Unicity Social Agent
          </span>
        </div>

        {/* Navigation tabs section - flex-1 to fill remaining space */}
        <nav className="flex-1">
          <NavTabs>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavTabItem
                  key={item.path}
                  asChild
                  state={isActive ? "active" : "inactive"}
                >
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-2",
                    )}
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </Link>
                </NavTabItem>
              );
            })}
          </NavTabs>
        </nav>
      </div>
    </header>
  );
};


