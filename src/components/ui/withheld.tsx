import { VisuallyHidden } from "./visually-hidden";

/** A field the backend withheld by policy: the word "withheld", never blank or a dash. */
export function Withheld({ field }: { field: string }) {
  return (
    <span data-testid="withheld" data-field={field} className="italic text-fg-muted">
      withheld
      <VisuallyHidden>: {field}</VisuallyHidden>
    </span>
  );
}
