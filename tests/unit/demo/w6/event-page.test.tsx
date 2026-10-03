import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventPage from "@/app/(platform)/demo/w6-provenance/events/[eventId]/page";
import { canonicalJson } from "@/lib/provenance/canonical";
import { sha256Hex } from "@/lib/provenance/sha256";
import type { EventManifest } from "@/lib/demo/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const load = vi.fn();
vi.mock("@/lib/demo/server-data", () => ({ load: (path: string) => load(path) }));
afterEach(() => load.mockReset());

async function manifest(): Promise<EventManifest> {
  const body = {
    schema: "newma.event.v1",
    event_type: "settlement.committed",
    unit: "demo credits",
  };
  const canonical = canonicalJson(body);
  return {
    event_id: "e-9",
    manifest: body,
    canonical,
    sha256: await sha256Hex(canonical),
    signature: "c2ln",
    kid: "demo-key-1",
    signature_label: "Demo signature, not production key",
  };
}

describe("W6 single-event page (additive, linked from W7)", () => {
  it("renders the manifest workbench for one event id with the demo-key label", async () => {
    load.mockResolvedValue({ data: await manifest() });
    render(await EventPage({ params: Promise.resolve({ eventId: "e-9" }) }));
    expect(load).toHaveBeenCalledWith("/v1/provenance/events/e-9/manifest");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("W6");
    expect(screen.getAllByText("Demo signature, not production key").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Verify signature" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All entities" })).toHaveAttribute(
      "href",
      "/demo/w6-provenance",
    );
  });

  it("shows the backend error when the event cannot be read", async () => {
    load.mockResolvedValue({ error: { code: "not_found", message: "Event not found." } });
    render(await EventPage({ params: Promise.resolve({ eventId: "e-9" }) }));
    expect(screen.getByRole("alert")).toHaveTextContent("not_found");
  });

  it("404s on an unsafe id before any read", async () => {
    await expect(EventPage({ params: Promise.resolve({ eventId: "../x" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(load).not.toHaveBeenCalled();
  });
});
