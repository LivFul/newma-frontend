import type { PersonaId } from "@/lib/personas";
import { canAct } from "@/lib/demo/persona-actions";
import { load } from "@/lib/demo/server-data";
import type { Claim, Items, SourceRecord } from "@/lib/demo/types";
import { ErrorNotice } from "../../_components/error-notice";
import { PersonaForbiddenNotice } from "../../_components/persona-forbidden-notice";
import { CurationQueue } from "./curation-queue";
import { IngestPanel } from "./ingest-panel";
import { ReleasePanel } from "./release-panel";

/** Source record → extracted claims → steward review → curated release. */
export async function CurationTab({ persona }: { persona: PersonaId }) {
  const [sources, queue] = await Promise.all([
    load<Items<SourceRecord>>("/v1/curation/source-records"),
    load<Items<Claim>>("/v1/curation/queue"),
  ]);
  const allowed = canAct(persona, "decide_claim");
  const claims = queue.data?.items ?? [];
  return (
    <div className="space-y-6">
      {allowed ? null : <PersonaForbiddenNotice allowed={["data_steward"]} />}
      <section aria-labelledby="sources-heading" className="space-y-2">
        <h3 id="sources-heading" className="text-lg font-semibold">
          Source records
        </h3>
        <ErrorNotice error={sources.error} />
        <IngestPanel sources={sources.data?.items ?? []} />
      </section>
      <section aria-labelledby="queue-heading" className="space-y-2">
        <h3 id="queue-heading" className="text-lg font-semibold">
          Curation queue
        </h3>
        <ErrorNotice error={queue.error} />
        <CurationQueue claims={claims} allowed={allowed} />
      </section>
      <section aria-labelledby="release-heading" className="space-y-2">
        <h3 id="release-heading" className="text-lg font-semibold">
          Curated release
        </h3>
        <ReleasePanel claims={claims} allowed={canAct(persona, "publish_release")} />
      </section>
    </div>
  );
}
