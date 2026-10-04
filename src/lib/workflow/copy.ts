/** The text of each copy block keyed by id, for code that draws labels onto shapes. */
export function textsOf(
  record: Readonly<Record<string, { readonly text: string }>>,
): Record<string, string> {
  return Object.fromEntries(Object.entries(record).map(([id, block]) => [id, block.text]));
}
