// The surveyor's benchmark: a marked, fixed point. Used where a scientist's sign-off or a guardrail
// is the fixed point in the flow. Decorative; the adjacent text carries the meaning.
export function BenchmarkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <circle cx="16" cy="16" r="14.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M16 7L25 22H7Z"
        fill="var(--color-route)"
        stroke="var(--color-route-edge)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 22H25" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
