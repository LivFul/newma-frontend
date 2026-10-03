import { serializeJsonLd } from "@/lib/seo/json-ld";

export function JsonLd({ data }: { data: Readonly<Record<string, unknown>> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built from constants and escaped by serializeJsonLd.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
