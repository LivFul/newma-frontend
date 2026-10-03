import { afterEach, describe, expect, it } from "vitest";
import { GET as TIMELINE } from "@/app/api/demo/provenance/[entityType]/[entityId]/route";
import { GET as MANIFEST } from "@/app/api/demo/provenance/events/[eventId]/manifest/route";
import { POST as VERIFY } from "@/app/api/demo/provenance/verify/route";
import { POST as TAMPER } from "@/app/api/demo/provenance/tamper/route";
import { armBff, bffRequest, disarmBff, sentBody, sentUrl } from "./bff-helpers";

const ID = "3f2b8c1e-1d2a-4b6c-9e8f-0a1b2c3d4e5f";
const post = (json: unknown) => bffRequest("/x", { method: "POST", json });

describe("W6 provenance BFF", () => {
  afterEach(disarmBff);

  it("reads a timeline for a contract entity type only", async () => {
    const fetchMock = armBff([Response.json({ events: [] })]);
    const ok = await TIMELINE(bffRequest("/x"), {
      params: Promise.resolve({ entityType: "gate", entityId: ID }),
    });
    expect(ok.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/provenance/gate/${ID}`);
    const bad = await TIMELINE(bffRequest("/x"), {
      params: Promise.resolve({ entityType: "events", entityId: ID }),
    });
    expect(bad.status).toBe(422);
    const badId = await TIMELINE(bffRequest("/x"), {
      params: Promise.resolve({ entityType: "gate", entityId: "../x" }),
    });
    expect(badId.status).toBe(400);
  });

  it("reads one manifest", async () => {
    const fetchMock = armBff([Response.json({ event_id: ID })]);
    await MANIFEST(bffRequest("/x"), { params: Promise.resolve({ eventId: ID }) });
    expect(sentUrl(fetchMock)).toBe(`https://api.example/v1/provenance/events/${ID}/manifest`);
  });

  it("verifies a manifest object with signature and kid", async () => {
    const body = { manifest: { a: 1 }, signature: "c2ln", kid: "demo-key-1" };
    const fetchMock = armBff([Response.json({ valid: true, sha256: "x", reasons: [] })]);
    const response = await VERIFY(post({ ...body, tamper: true }));
    expect(response.status).toBe(200);
    expect(sentBody(fetchMock)).toEqual(body);
  });

  it.each([
    { manifest: "x", signature: "s", kid: "k" },
    { manifest: [1], signature: "s", kid: "k" },
    { manifest: {}, signature: "", kid: "k" },
    { manifest: {}, signature: "s" },
  ])("rejects verify body %j", async (body) => {
    const fetchMock = armBff([]);
    expect((await VERIFY(post(body))).status).toBe(422);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("routes the tamper toggle to the demo-only backend route", async () => {
    const fetchMock = armBff([Response.json({ tampered_path: "payload.decision" })]);
    await TAMPER(post({ event_id: ID }));
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/demo/provenance/tamper");
    expect(sentBody(fetchMock)).toEqual({ event_id: ID });
    expect((await TAMPER(post({ event_id: "../x" }))).status).toBe(422);
  });
});
