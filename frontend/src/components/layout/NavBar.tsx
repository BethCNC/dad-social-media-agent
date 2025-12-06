import { Link, useLocation } from "react-router-dom";
import { Home, Video, Plus, Calendar, Settings } from "lucide-react";

import { cn } from "@/lib/utils";
import { NavTabs, NavTabItem } from "@/components/ui/nav-tabs";

const NAV_ITEMS = [
  { path: "/", label: "Home", icon: Home },
  { path: "/bank", label: "Content Bank", icon: Video },
  { path: "/wizard", label: "Custom Post", icon: Plus },
  { path: "/weekly", label: "Planning", icon: Calendar },
  { path: "/settings", label: "Settings", icon: Settings },
];

export const NavBar = () => {
  const location = useLocation();

  return (
    <header className="bg-bg-subtle border-b border-border-default sticky top-0 z-50 w-full">
      {/* Main container - full width with proper padding */}
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="flex items-center py-2 sm:py-4 w-full">
          {/* Logo and name section - gap-2 (8px from gap/md), pl-0 pr-3 (12px), py-0 */}
          <div className="flex items-center gap-1 sm:gap-2 pl-0 pr-2 sm:pr-3 py-0 shrink-0">
            {/* Logo container - p-[6px] with bg-secondary */}
            <div className="p-[4px] sm:p-[6px] bg-bg-secondary rounded shrink-0">
              <img
                src="/logo.png"
                alt="Unicity Social Agent"
                className="h-5 w-5 sm:h-6 sm:w-6"
              />
            </div>
            {/* App name - text-lg (18px), font-bold (700), leading-6 (24px), text-fg-subtle */}
            <span className="text-sm sm:text-lg font-bold text-fg-subtle whitespace-nowrap shrink-0 hidden xs:inline">
              Unicity Social Agent
            </span>
          </div>

          {/* Navigation tabs section - flex-1 to fill remaining space, scrollable on mobile */}
          <nav className="flex-1 overflow-x-auto scrollbar-hide">
            <NavTabs>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path ||
                  (item.path === "/" && location.pathname === "/") ||
                  (item.path === "/bank" && location.pathname.startsWith("/bank")) ||
                  (item.path === "/wizard" && location.pathname.startsWith("/wizard")) ||
                  (item.path === "/weekly" && location.pathname.startsWith("/weekly"));
                return (
                  <NavTabItem
                    key={item.path}
                    asChild
                    state={isActive ? "active" : "inactive"}
                  >
                    <Link
                      to={item.path}
                      className={cn(
                        "flex items-center gap-1 sm:gap-2",
                      )}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="hidden sm:inline text-sm sm:text-base">{item.label}</span>
                    </Link>
                  </NavTabItem>
                );
              })}
            </NavTabs>
          </nav>
        </div>
      </div>
    </header>
  );
};


