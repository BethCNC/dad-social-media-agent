import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const navTabsVariants = cva(
  // Container for top-level navigation tabs. Fills the remaining
  // horizontal space next to the logo block in the nav bar and applies
  // the vertical dividers between items to match the Figma nav bar.
  "flex w-full items-stretch text-fg-body divide-x divide-border-strong",
)

const navTabItemVariants = cva(
  // Tab item matches the primary top-nav tabs in Figma:
  // - Full-height clickable area
  // - 12px padding (p-3) - matches Figma padding/lg
  // - Icon + label with 8px gap (gap-2) - matches Figma gap/md
  // - text-lg (18px) font-medium (500) leading-6 (24px) - matches Figma text-lg/font-medium
  // - Active tab uses the primary action background; inactive
  //   tab keeps the page background with subtle hover.
  "flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap p-3 text-lg font-medium leading-6 ring-offset-bg-page transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      state: {
        inactive:
          "bg-bg-page text-fg-body hover:bg-bg-subtle/60",
        active:
          "bg-bg-action text-fg-inverse shadow-sm",
      },
    },
    defaultVariants: {
      state: "inactive",
    },
  }
)

export interface NavTabsProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const NavTabs = React.forwardRef<HTMLDivElement, NavTabsProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(navTabsVariants(), className)}
        {...props}
      />
    )
  }
)
NavTabs.displayName = "NavTabs"

export interface NavTabItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof navTabItemVariants> {
  asChild?: boolean
}

export const NavTabItem = React.forwardRef<HTMLButtonElement, NavTabItemProps>(
  ({ className, state, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(navTabItemVariants({ state, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
NavTabItem.displayName = "NavTabItem"


