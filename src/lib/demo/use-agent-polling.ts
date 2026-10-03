"use client";
import type { AgentQuery, AgentStatus } from "./types";
import { type Polling, usePolling } from "./use-polling";

// W3 polls the one query endpoint (never one request per job) every 2 s until it settles.
const SETTLED: ReadonlySet<AgentStatus> = new Set(["completed", "held", "failed"]);

export const isSettled = (query: AgentQuery): boolean => SETTLED.has(query.status);

export function useAgentPolling(id: string | undefined): Polling<AgentQuery> {
  return usePolling<AgentQuery>(
    id === undefined ? undefined : `/api/demo/agent/queries/${encodeURIComponent(id)}`,
    isSettled,
  );
}
