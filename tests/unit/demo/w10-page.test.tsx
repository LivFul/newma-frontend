import { render, screen } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustodianPage from "@/app/(platform)/demo/w10-custodian/page";
import { custodianAgreement, custodianView } from "./p5b-fixtures";

const state = vi.hoisted(() => ({
  persona: "community_liaison",
  paths: [] as string[],
  error: undefined as undefined | { code: string; message: string },
}));

vi.mock("@/lib/demo/current-session", () => ({
  requireSession: async () => ({ persona: state.persona, tenant_id: "t" }),
}));
vi.mock("@/lib/demo/server-data", () => ({
  load: async (path: string) => {
    state.paths.push(path);
    if (state.error) return { error: state.error };
    return {
      data: custodianView({
        agreements: [
          custodianAgreement(),
          custodianAgreement({ rights_record_id: "rec-2", title: "Second agreement — fictional" }),
        ],
      }),
    };
  },
}));

const page = async (params: Record<string, string> = {}) =>
  render(await CustodianPage({ searchParams: Promise.resolve(params) }));

describe("W10 page", () => {
  beforeEach(() => {
    state.persona = "community_liaison";
    state.paths = [];
    state.error = undefined;
  });

  it("reads the custodian view and renders the summary and one card per agreement", async () => {
    await page();
    expect(state.paths).toEqual(["/v1/custodian/view"]);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Custodian view");
    expect(screen.getByRole("region", { name: "At a glance" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(2);
  });

  it("gives every agreement form its own fresh idempotency key", async () => {
    const { container } = await page();
    const keys = [...container.querySelectorAll('input[name="idempotency_key"]')].map(
      (input) => (input as HTMLInputElement).value,
    );
    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
    for (const key of keys) expect(key).toMatch(/^[A-Za-z0-9._:-]{1,128}$/);
  });

  it("shows the sent notice from ?raised and the error sentence from ?error", async () => {
    await page({ raised: "grv-1" });
    expect(screen.getByRole("status")).toHaveTextContent("Your concern was sent");
  });

  it("shows an alert for an allow-listed ?error", async () => {
    await page({ error: "validation_error" });
    expect(screen.getByRole("alert")).toHaveTextContent("at least 10 characters");
  });

  it("shows the persona notice and does not read the view for a scientist", async () => {
    state.persona = "scientist";
    await page();
    expect(state.paths).toEqual([]);
    expect(screen.getByRole("note")).toHaveTextContent(
      "Community liaison, Data steward, Tenant admin",
    );
    expect(screen.queryByRole("article")).toBeNull();
  });

  it("renders a backend error", async () => {
    state.error = { code: "persona_forbidden", message: "Persona not allowed." };
    await page();
    expect(screen.getByRole("alert")).toHaveTextContent("persona_forbidden");
  });
});

// The page must stay light and work without JavaScript: no client module anywhere in its tree.
const SRC = path.join(import.meta.dirname, "..", "..", "..", "src");

function resolveImport(from: string, spec: string): string | undefined {
  const base = spec.startsWith("@/")
    ? path.join(SRC, spec.slice(2))
    : spec.startsWith(".")
      ? path.resolve(path.dirname(from), spec)
      : undefined;
  if (!base) return undefined;
  for (const candidate of [
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, "index.tsx"),
    path.join(base, "index.ts"),
  ]) {
    try {
      if (statSync(candidate).isFile()) return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  return undefined;
}

function walk(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry)) return seen;
  seen.add(entry);
  const source = readFileSync(entry, "utf8");
  for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
    const target = resolveImport(entry, match[1]);
    if (target) walk(target, seen);
  }
  return seen;
}

describe("W10 import graph", () => {
  const files = [...walk(path.join(SRC, "app/(platform)/demo/w10-custodian/page.tsx"))];

  it("walks the page tree", () => {
    expect(files.length).toBeGreaterThan(8);
    expect(
      readdirSync(path.join(SRC, "app/(platform)/demo/w10-custodian/_components")).length,
    ).toBeGreaterThan(5);
  });

  it("imports no client module and uses no client-only API", () => {
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      const rel = path.relative(SRC, file);
      expect(source, rel).not.toMatch(/^["']use client["']/m);
      expect(source, rel).not.toMatch(
        /\b(useState|useEffect|useRouter|onClick|onChange|onSubmit)\b/,
      );
      expect(source, rel).not.toMatch(/from\s+["']@\/components\/ui["']/);
    }
  });
});
