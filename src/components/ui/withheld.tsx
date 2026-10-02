/** A field the backend withheld by policy: the word "withheld", never blank or a dash. */
export function Withheld({ field }: { field: string }) {
  return (
    <span aria-label={`withheld: ${field}`} className="italic text-fg-muted">
      withheld
    </span>
  );
}
