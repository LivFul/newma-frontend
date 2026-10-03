"use client";
import { useEffect, useState } from "react";

// Whether any of the jobs was retried. The agent query shows "retrying" only transiently, so once
// the query has settled each job is read once (no polling) and `attempts > 0` is the evidence.
export function useJobRetries(jobIds: readonly string[], enabled: boolean): boolean {
  const key = jobIds.join(",");
  const [result, setResult] = useState<Readonly<{ key: string; retried: boolean }>>();

  useEffect(() => {
    if (!enabled || key === "") return undefined;
    const controller = new AbortController();
    const reads = key.split(",").map(async (id) => {
      try {
        const response = await fetch(`/api/demo/jobs/${encodeURIComponent(id)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const job = response.ok ? ((await response.json()) as { attempts?: number }) : undefined;
        return (job?.attempts ?? 0) > 0;
      } catch {
        return false;
      }
    });
    void Promise.all(reads).then((flags) => {
      if (!controller.signal.aborted) setResult({ key, retried: flags.some(Boolean) });
    });
    return () => controller.abort();
  }, [key, enabled]);

  return result?.key === key && result.retried;
}
