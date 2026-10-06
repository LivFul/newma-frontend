const SHORT = 16;

/** Split a hero title or descriptor so pipeline labels stay inside the viewBox. */
export function wrapHeroLabel(text: string): string[] {
  const amp = text.indexOf(" & ");
  if (amp >= 0) return [`${text.slice(0, amp)} &`, text.slice(amp + 3)];
  const words = text.split(" ");
  // Two real words only: a stray leading or trailing space must not produce an empty line.
  if (words.length === 2 && words[0] && words[1] && text.length >= SHORT - 1) return words;
  if (text.length <= SHORT) return [text];
  const mid = Math.floor(text.length / 2);
  let at = text.lastIndexOf(" ", mid);
  const after = text.indexOf(" ", mid);
  if (at < 0) at = after;
  else if (after >= 0 && after - mid <= mid - at) at = after;
  if (at <= 0) return [text];
  return [text.slice(0, at), text.slice(at + 1)];
}
