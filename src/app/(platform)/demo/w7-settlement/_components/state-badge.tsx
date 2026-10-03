import { Badge, VisuallyHidden } from "@/components/ui";
import { W7_STATE_TONES, type W7Vocabulary } from "@/lib/demo/w7-status";
import { humanize } from "../../_components/fields";

type Props<V extends W7Vocabulary> = Readonly<{
  vocabulary: V;
  value: keyof (typeof W7_STATE_TONES)[V] & string;
}>;

/** State text and colour together (never colour alone); screen readers hear "Status: ...". */
export function W7StateBadge<V extends W7Vocabulary>({ vocabulary, value }: Props<V>) {
  const tones: Readonly<Record<string, "neutral" | "accent" | "warning" | "danger" | "success">> =
    W7_STATE_TONES[vocabulary];
  return (
    <Badge tone={Object.hasOwn(tones, value) ? tones[value] : "neutral"} data-state={value}>
      <VisuallyHidden>Status: </VisuallyHidden>
      {humanize(value)}
    </Badge>
  );
}
