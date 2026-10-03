import { AccessLink } from "@/components/site/access-link";
import { DETAIL_COPY, demoInstruction, demoLabelsSentence } from "@/content/ecosystem/detail-copy";
import type { EcosystemEntry } from "@/content/ecosystem/registry";

// The link always goes to /access: a ?next= parameter is forbidden by the open-redirect rule, so the
// block names the destination in words instead. Deep demo routes redirect to /access without a session.
export function DemoLink({ entry }: { entry: EcosystemEntry }) {
  const labels = demoLabelsSentence(entry);
  return (
    <section aria-labelledby="demo-heading" className="mt-12 border-t border-border pt-8">
      <h2 id="demo-heading" className="font-display text-2xl tracking-tight">
        {DETAIL_COPY.demoHeading.text}
      </h2>
      <p className="mt-4 max-w-[62ch] text-fg-muted">
        {DETAIL_COPY.signIn.text} {demoInstruction(entry)}
        {labels ? ` ${labels}` : null}
      </p>
      <div className="mt-6">
        <AccessLink variant="primary" size="lg" className="min-h-11">
          {DETAIL_COPY.demoCta.text}
        </AccessLink>
      </div>
    </section>
  );
}
