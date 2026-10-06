const SHORT = 16;

/** Split a hero title or descriptor so pipeline labels stay inside the viewBox. */
export function wrapHeroLabel(text: string): string[] {
  const amp = text.indexOf(" & ");
  if (amp >= 0) return [`${text.slice(0, amp)} &`, text.slice(amp + 3)];
  if (text.length <= SHORT) return [text];
  const mid = Math.floor(text.length / 2);
  let at = text.lastIndexOf(" ", mid);
  const after = text.indexOf(" ", mid);
  if (at < 0) at = after;
  else if (after >= 0 && after - mid <= mid - at) at = after;
  if (at <= 0) return [text];
  return [text.slice(0, at), text.slice(at + 1)];
}
