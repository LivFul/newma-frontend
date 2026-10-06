import { cn } from "@/lib/cn";
import { LeafIcon } from "./leaf-icon";
import { PillIcon } from "./pill-icon";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)} aria-hidden="true">
      <LeafIcon className="h-7 w-auto" />
      <PillIcon className="h-7 w-auto" />
    </span>
  );
}
