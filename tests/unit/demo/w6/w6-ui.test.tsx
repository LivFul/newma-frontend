import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EventTimeline } from "@/app/(platform)/demo/w6-provenance/_components/event-timeline";
import { ManifestWorkbench } from "@/app/(platform)/demo/w6-provenance/_components/manifest-workbench";
import { canonicalJson } from "@/lib/provenance/canonical";
import { sha256Hex } from "@/lib/provenance/sha256";
import type { EventManifest, ProvenanceEvent } from "@/lib/demo/types";

afterEach(() => vi.unstubAllGlobals());

const event = (seq: number, type: string): ProvenanceEvent => ({
  id: `e-${seq}`,
  seq,
  event_type: type,
  actor_persona: "scientific_approver",
  authority: "demo-tenant",
  occurred_at: "2030-01-01T00:00:00Z",
  policy_version: "demo-policy-1",
  entity_version: seq,
  payload: {},
  payload_sha256: "a".repeat(64),
  signature: "sig",
  kid: "demo-key-1",
});

async function manifestFixture(): Promise<EventManifest> {
  const manifest = {
    schema: "newma.event.v1",
    seq: 1,
    event_type: "gate.decided",
    payload: { decision: "pass" },
  };
  const canonical = canonicalJson(manifest);
  return {
    event_id: "e-1",
    manifest,
    canonical,
    sha256: await sha256Hex(canonical),
    signature: "c2ln",
    kid: "demo-key-1",
    signature_label: "Demo signature, not production key",
  };
}

describe("EventTimeline", () => {
  it("lists events by seq with their facts and offers no edit or delete", () => {
    render(
      <EventTimeline
        events={[event(1, "gate.created"), event(2, "gate.decided")]}
        entityType="gate"
        entityId="g-1"
        selected="e-2"
      />,
    );
    const items = within(screen.getByRole("list", { name: "Event timeline" })).getAllByRole(
      "listitem",
    );
    expect(items.map((i) => i.getAttribute("data-seq"))).toEqual(["1", "2"]);
    expect(items[1]).toHaveTextContent("gate.decided");
    expect(items[1]).toHaveTextContent("demo-policy-1");
    expect(items[1]).toHaveTextContent("Scientific approver");
    expect(screen.queryAllByRole("button", { name: /edit|delete|remove/i })).toHaveLength(0);
    expect(within(items[0]).getByRole("link", { name: /Inspect event 1/ })).toHaveAttribute(
      "href",
      "/demo/w6-provenance/gate/g-1?event=e-1",
    );
  });
});

describe("ManifestWorkbench", () => {
  it("shows matching hashes, verifies, tampers visibly and restores", async () => {
    const original = await manifestFixture();
    const tampered = { ...(original.manifest as object), payload: { decision: "fail" } };
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
      async (url, init) => {
        if (url.endsWith("/tamper")) {
          return Response.json({
            event_id: "e-1",
            manifest: tampered,
            signature: "c2ln",
            kid: "demo-key-1",
            tampered_path: "payload.decision",
            label: "Demo tamper toggle",
          });
        }
        const sent = JSON.parse(String(init.body));
        const valid = JSON.stringify(sent.manifest) === JSON.stringify(original.manifest);
        return Response.json({ valid, sha256: "x", reasons: valid ? [] : ["signature_mismatch"] });
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ManifestWorkbench manifest={original} />);

    expect(screen.getByText("Demo signature, not production key")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("hash-comparison")).toHaveTextContent("Hashes match"),
    );
    expect(screen.getByTestId("canonical-comparison")).toHaveTextContent(
      "matches the server byte-for-byte",
    );

    await user.click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByTestId("verify-result")).toHaveTextContent("Valid");

    const toggle = screen.getByRole("switch", { name: "Demo tamper toggle" });
    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "true"));
    expect(screen.getByText(/Altered field: payload\.decision/)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId("hash-comparison")).toHaveTextContent("Hashes differ"),
    );
    expect(screen.queryByTestId("verify-result")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByTestId("verify-result")).toHaveTextContent(
      "Invalid: signature_mismatch",
    );
    expect(screen.getByRole("status", { name: "Verification result" })).toHaveTextContent(
      "Invalid",
    );

    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
    expect(await screen.findByTestId("verify-result")).toHaveTextContent("Valid");
    await waitFor(() =>
      expect(screen.getByTestId("hash-comparison")).toHaveTextContent("Hashes match"),
    );
  });
});

describe("EntityLinks", () => {
  it("uses an h2 so the page heading order never skips a level", async () => {
    const { EntityLinks } =
      await import("@/app/(platform)/demo/w6-provenance/_components/entity-picker");
    render(
      <EntityLinks
        title="Decided gates"
        links={[{ entityType: "gate", entityId: "g-1", label: "DEMO-C-002 H1 (PASS)" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 2, name: "Decided gates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "DEMO-C-002 H1 (PASS)" })).toHaveAttribute(
      "href",
      "/demo/w6-provenance/gate/g-1",
    );
  });
});

describe("ManifestWorkbench races and failure modes", () => {
  type Deferred = { resolve: (r: Response) => void };
  const deferred = (): [Promise<Response>, Deferred] => {
    let resolve: (r: Response) => void = () => undefined;
    const promise = new Promise<Response>((r) => (resolve = r));
    return [promise, { resolve }];
  };

  it("keeps Verify inert while a tamper request is in flight, and never shows a stale Valid", async () => {
    const original = await manifestFixture();
    const tampered = { ...(original.manifest as object), payload: { decision: "fail" } };
    const [tamperPending, tamperGate] = deferred();
    const verifies: unknown[] = [];
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(
      async (url, init) => {
        if (url.endsWith("/tamper")) return tamperPending;
        const sent = JSON.parse(String(init.body));
        verifies.push(sent.manifest);
        const valid = JSON.stringify(sent.manifest) === JSON.stringify(original.manifest);
        return Response.json({ valid, sha256: "x", reasons: valid ? [] : ["signature_mismatch"] });
      },
    );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ManifestWorkbench manifest={original} />);
    await user.click(screen.getByRole("switch", { name: "Demo tamper toggle" }));
    const verify = screen.getByRole("button", { name: "Verify signature" });
    expect(verify).toHaveAttribute("aria-disabled", "true");
    await user.click(verify);
    expect(verifies).toHaveLength(0);
    tamperGate.resolve(
      Response.json({
        event_id: "e-1",
        manifest: tampered,
        signature: "c2ln",
        kid: "demo-key-1",
        tampered_path: "payload.decision",
        label: "Demo tamper toggle",
      }),
    );
    await waitFor(() =>
      expect(screen.getByRole("switch", { name: "Demo tamper toggle" })).toHaveAttribute(
        "aria-checked",
        "true",
      ),
    );
    expect(screen.queryByTestId("verify-result")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByTestId("verify-result")).toHaveTextContent("Invalid");
    expect(verifies).toEqual([tampered]);
  });

  it("a double click on Verify sends one request", async () => {
    const original = await manifestFixture();
    const [gate, release] = deferred();
    const fetchMock = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(() => gate);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ManifestWorkbench manifest={original} />);
    const verify = screen.getByRole("button", { name: "Verify signature" });
    await user.dblClick(verify);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    release.resolve(Response.json({ valid: true, sha256: "x", reasons: [] }));
    expect(await screen.findByTestId("verify-result")).toHaveTextContent("Valid");
  });

  it("keeps a persistent polite status region for the verification result", async () => {
    const original = await manifestFixture();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ valid: true, sha256: "x", reasons: [] })),
    );
    render(<ManifestWorkbench manifest={original} />);
    const region = screen.getByRole("status", { name: "Verification result" });
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toBeEmptyDOMElement();
    await userEvent.setup().click(screen.getByRole("button", { name: "Verify signature" }));
    expect(await screen.findByTestId("verify-result")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Verification result" })).toBe(region);
  });

  it("says why it cannot canonicalise instead of hashing an empty string", async () => {
    const original = await manifestFixture();
    const bad = { ...original, manifest: { schema: "x", big: 1e16 } };
    render(<ManifestWorkbench manifest={bad} />);
    expect(await screen.findByTestId("canonical-error")).toHaveTextContent(/Cannot canonicalise/);
    expect(screen.getByTestId("hash-comparison")).toHaveTextContent("No browser hash");
  });

  it("explains an unavailable crypto.subtle and a canonical form that differs by float spelling", async () => {
    const original = await manifestFixture();
    const subtle = globalThis.crypto.subtle;
    Object.defineProperty(globalThis.crypto, "subtle", { value: undefined, configurable: true });
    try {
      render(
        <ManifestWorkbench
          manifest={{ ...original, canonical: '{"a":1.0}', manifest: { a: 1 } }}
        />,
      );
      expect(await screen.findByTestId("hash-comparison")).toHaveTextContent(
        "Browser hashing unavailable",
      );
      expect(screen.getByTestId("canonical-comparison")).toHaveTextContent("integral floats");
    } finally {
      Object.defineProperty(globalThis.crypto, "subtle", { value: subtle, configurable: true });
    }
  });
});

describe("JsonView tamper mark", () => {
  it("marks the altered line inside the JSON as well as in the text", async () => {
    const { JsonView } = await import("@/components/ui/json-view");
    const { container } = render(
      <JsonView
        value={{ payload: { decision: "fail", n: 1 } }}
        label="Manifest"
        highlightPath="payload.decision"
      />,
    );
    const marked = container.querySelector("mark");
    expect(marked).toHaveTextContent('"decision": "fail"');
    expect(container.querySelectorAll("mark")).toHaveLength(1);
  });
});
