import { AccessLink } from "@/components/site/access-link";
import { DETAIL_COPY, demoInstruction, demoLabelsSentence } from "@/content/ecosystem/detail-copy";
import type { EcosystemEntry } from "@/content/ecosystem/registry";

// The link always goes to /access: a ?next= parameter is forbidden by the open-redirect rule, so the
// block names the destination in words instead. Deep demo routes redirect to /access without a session.
export function DemoLink({ entry }: { entry: EcosystemEntry }) {
  const labels = demoLabelsSentence(entry);
  return (
    <section aria-labelledby="demo-heading" className="sheet mt-14 px-6 py-8 md:px-10">
      <h2 id="demo-heading" className="text-2xl font-medium tracking-[-0.015em]">
        {DETAIL_COPY.demoHeading.text}
      </h2>
      <p className="mt-4 max-w-[60ch] leading-relaxed text-fg-muted">
        {DETAIL_COPY.signIn.text} {demoInstruction(entry)}
        {labels ? ` ${labels}` : null}
      </p>
      <div className="mt-6">
        <AccessLink variant="primary" size="lg" className="min-h-12">
          {DETAIL_COPY.demoCta.text}
        </AccessLink>
      </div>
    </section>
  );
}
