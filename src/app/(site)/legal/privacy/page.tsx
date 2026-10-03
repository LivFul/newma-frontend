import { LegalDocumentView } from "@/components/site/legal-document";
import { PRIVACY } from "@/content/legal/privacy";
import { pageMetadata } from "@/lib/seo/metadata";
import { LEGAL_APPROVED } from "@/lib/site";

// Noindex and out of the sitemap until the text is approved (assumption A-P4-03).
export const metadata = pageMetadata({
  path: "/legal/privacy",
  title: "Privacy — NEWMA",
  description: PRIVACY.sections[0]!.paragraphs[0]!.text,
  index: LEGAL_APPROVED,
});

export default function PrivacyPage() {
  return <LegalDocumentView doc={PRIVACY} />;
}
