const SHORT = 12;

/** Split a hero title or descriptor so orbital labels stay inside the viewBox. */
export function wrapHeroLabel(text: string): string[] {
  if (text.length <= SHORT) return [text];
  const amp = text.indexOf(" & ");
  if (amp >= 0) return [`${text.slice(0, amp)} &`, text.slice(amp + 3)];
  const mid = Math.floor(text.length / 2);
  let at = text.lastIndexOf(" ", mid);
  const after = text.indexOf(" ", mid);
  if (at < 0) at = after;
  else if (after >= 0 && after - mid <= mid - at) at = after;
  if (at <= 0) return [text];
  return [text.slice(0, at), text.slice(at + 1)];
}
