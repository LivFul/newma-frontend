/** The `{…}` block that follows the first `marker` in `css`, braces included (nested blocks kept). */
export function cssBlockAfter(css: string, marker: string): string {
  const at = css.indexOf(marker);
  if (at < 0) throw new Error(`missing ${marker}`);
  const open = css.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === "{") depth += 1;
    else if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open, i + 1);
    }
  }
  throw new Error(`unclosed ${marker}`);
}
