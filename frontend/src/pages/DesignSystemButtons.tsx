import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Trash2 } from "lucide-react";

const buttonVariantKeys = [
  "default",
  "destructive",
  "outline",
  "secondary",
  "ghost",
  "link",
] as const;
const buttonSizeKeys = ["sm", "default", "lg", "icon"] as const;

export function DesignSystemButtonsPage() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold text-fg-headings">Buttons</h1>
        <p className="text-sm text-fg-subtle">
          Primitive + semantic token–driven buttons, mirroring the Figma button styles
          from the Unicity design file.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-fg-headings">Variants</h2>
        <div className="flex flex-wrap gap-4">
          {buttonVariantKeys.map((variant) => (
            <div key={variant} className="flex flex-col items-start gap-2">
              <span className="text-xs uppercase tracking-wide text-fg-subtle">
                {variant}
              </span>
              <Button variant={variant === "default" ? undefined : variant}>
                {variant === "default" && <Plus className="mr-2" />}
                {variant === "destructive" && <Trash2 className="mr-2" />}
                {variant.charAt(0).toUpperCase() + variant.slice(1)}
                {variant === "link" && <ArrowRight className="ml-1" />}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium text-fg-headings">Sizes</h2>
        <div className="flex flex-wrap gap-4 items-end">
          {buttonSizeKeys.map((size) => (
            <div key={size} className="flex flex-col items-start gap-2">
              <span className="text-xs uppercase tracking-wide text-fg-subtle">
                {size}
              </span>
              <Button size={size === "default" ? undefined : size}>
                {size === "icon" ? <Plus /> : "Button"}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


