import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ActionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "elevated" | "action";
  showArrow?: boolean;
  footer?: React.ReactNode;
}

export const ActionCard = React.forwardRef<HTMLDivElement, ActionCardProps>(
  (
    {
      icon: Icon,
      title,
      description,
      actionLabel,
      onAction,
      variant = "default",
      showArrow = false,
      footer,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      default: "bg-bg-elevated border-border-default hover:border-border-strong",
      elevated: "bg-bg-elevated border-border-strong shadow-lg",
      action: "bg-bg-action text-fg-inverse border-bg-action",
    };

    return (
      <Card
        ref={ref}
        className={cn(
          "transition-all cursor-pointer group",
          variantStyles[variant],
          onAction && "hover:shadow-md",
          className
        )}
        onClick={onAction}
        {...props}
      >
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            {Icon && (
              <Icon
                className={cn(
                  "w-10 h-10",
                  variant === "action" ? "text-fg-inverse" : "text-fg-headings"
                )}
              />
            )}
            {showArrow && (
              <ArrowRight
                className={cn(
                  "w-6 h-6 transition-transform group-hover:translate-x-1",
                  variant === "action" ? "text-fg-inverse" : "text-fg-subtle"
                )}
              />
            )}
          </div>
          <CardTitle
            className={cn(
              "text-2xl font-bold",
              variant === "action" ? "text-fg-inverse" : "text-fg-headings"
            )}
          >
            {title}
          </CardTitle>
          {description && (
            <CardDescription
              className={cn(
                "text-lg",
                variant === "action" ? "text-fg-inverse/80" : "text-fg-subtle"
              )}
            >
              {description}
            </CardDescription>
          )}
        </CardHeader>

        {children && <CardContent>{children}</CardContent>}

        {(actionLabel || footer) && (
          <CardFooter>
            {footer || (
              actionLabel && (
                <Button
                  variant={variant === "action" ? "secondary" : "default"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.();
                  }}
                  className="w-full"
                >
                  {actionLabel}
                </Button>
              )
            )}
          </CardFooter>
        )}
      </Card>
    );
  }
);
ActionCard.displayName = "ActionCard";

