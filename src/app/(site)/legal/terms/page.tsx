import { LegalDocumentView } from "@/components/site/legal-document";
import { TERMS } from "@/content/legal/terms";
import { pageMetadata } from "@/lib/seo/metadata";
import { LEGAL_APPROVED } from "@/lib/site";

// Noindex and out of the sitemap until the text is approved (assumption A-P4-03).
export const metadata = pageMetadata({
  path: "/legal/terms",
  title: "Terms — NEWMA",
  description: TERMS.sections[0]!.paragraphs[0]!.text,
  index: LEGAL_APPROVED,
});

export default function TermsPage() {
  return <LegalDocumentView doc={TERMS} />;
}
