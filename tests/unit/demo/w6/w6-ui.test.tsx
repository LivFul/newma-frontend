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
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid: signature_mismatch");

    await user.click(toggle);
    await waitFor(() => expect(toggle).toHaveAttribute("aria-checked", "false"));
    expect(await screen.findByTestId("verify-result")).toHaveTextContent("Valid");
    await waitFor(() =>
      expect(screen.getByTestId("hash-comparison")).toHaveTextContent("Hashes match"),
    );
  });
});
