import { afterEach, describe, expect, it } from "vitest";
import { GET as LIST, POST as CREATE } from "@/app/api/demo/jobs/route";
import { GET as POLL } from "@/app/api/demo/jobs/[id]/route";
import { POST as CANCEL } from "@/app/api/demo/jobs/[id]/cancel/route";
import {
  SID,
  TOKEN,
  armBff,
  bffRequest,
  disarmBff,
  envelope,
  sentBody,
  sentHeaders,
  sentUrl,
  setCookieHeader,
} from "./bff-helpers";

const job = (state: string) =>
  Response.json({
    id: "job-1",
    kind: "screening",
    state,
    progress: 0.5,
    attempts: 0,
    max_attempts: 3,
    result: null,
    error: null,
    cost_credits: 0,
    budget_credits: null,
    created_at: "2030-01-01T00:00:00Z",
    updated_at: "2030-01-01T00:00:01Z",
    started_at: null,
    finished_at: null,
  });

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/demo/jobs/[id]", () => {
  afterEach(disarmBff);

  it("polls once, forwards X-Demo-Session and answers with Cache-Control: no-store", async () => {
    const fetchMock = armBff([job("RUNNING")]);
    const response = await POLL(bffRequest("/api/demo/jobs/job-1"), ctx("job-1"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/jobs/job-1");
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await response.json()).state).toBe("RUNNING");
  });

  it("rejects an id that is not a safe path segment", async () => {
    const fetchMock = armBff([]);
    const response = await POLL(bffRequest("/api/demo/jobs/x"), ctx("../demo/reset"));
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("clears the cookie on an expired session", async () => {
    armBff([envelope("session_expired", 401)]);
    const response = await POLL(bffRequest("/api/demo/jobs/job-1"), ctx("job-1"));
    expect(response.status).toBe(401);
    expect(setCookieHeader(response)).toMatch(/Max-Age=0/);
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await POLL(bffRequest("/api/demo/jobs/job-1"), ctx("job-1"))).status).toBe(404);
  });
});

describe("POST /api/demo/jobs", () => {
  afterEach(disarmBff);

  it("forwards a valid job request and passes the Idempotent-Replayed header through", async () => {
    const replayed = new Response(await job("QUEUED").text(), {
      status: 200,
      headers: { "content-type": "application/json", "idempotent-replayed": "true" },
    });
    const fetchMock = armBff([replayed]);
    const payload = {
      kind: "screening",
      payload: { inject_failure: true },
      idempotency_key: "k-1",
    };
    const response = await CREATE(bffRequest("/api/demo/jobs", { method: "POST", json: payload }));
    expect(response.status).toBe(200);
    expect(response.headers.get("idempotent-replayed")).toBe("true");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/jobs");
    expect(sentBody(fetchMock)).toEqual(payload);
    expect(sentHeaders(fetchMock).get("x-demo-session")).toBe(SID);
  });

  it("returns 201 for a fresh job", async () => {
    armBff([
      new Response(await job("QUEUED").text(), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    ]);
    const payload = { kind: "admet", payload: {}, idempotency_key: "k-2", budget_credits: 5 };
    const response = await CREATE(bffRequest("/api/demo/jobs", { method: "POST", json: payload }));
    expect(response.status).toBe(201);
    expect(response.headers.has("idempotent-replayed")).toBe(false);
  });

  it.each([
    { kind: "mining", payload: {}, idempotency_key: "k" },
    { kind: "screening", payload: {}, idempotency_key: "" },
    { kind: "screening", payload: {}, idempotency_key: "k", budget_credits: "ten" },
    "not-an-object",
  ])("rejects an invalid body %j with 400", async (body) => {
    const fetchMock = armBff([]);
    const response = await CREATE(bffRequest("/api/demo/jobs", { method: "POST", json: body }));
    expect(response.status).toBe(400);
    expect((await response.json()).code).toBe("invalid_job_request");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never echoes the service token in an error body", async () => {
    armBff([envelope("budget_exceeded", 402)]);
    const response = await CREATE(
      bffRequest("/api/demo/jobs", {
        method: "POST",
        json: { kind: "screening", payload: {}, idempotency_key: "k" },
      }),
    );
    expect(response.status).toBe(402);
    expect(await response.text()).not.toContain(TOKEN);
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    const response = await CREATE(
      bffRequest("/api/demo/jobs", {
        method: "POST",
        json: { kind: "screening", payload: {}, idempotency_key: "k" },
      }),
    );
    expect(response.status).toBe(404);
  });
});

describe("GET /api/demo/jobs", () => {
  afterEach(disarmBff);

  it("lists jobs with no-store", async () => {
    const fetchMock = armBff([Response.json({ items: [] })]);
    const response = await LIST(bffRequest("/api/demo/jobs"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/jobs");
    expect(await response.json()).toEqual({ items: [] });
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    expect((await LIST(bffRequest("/api/demo/jobs"))).status).toBe(404);
  });
});

describe("POST /api/demo/jobs/[id]/cancel", () => {
  afterEach(disarmBff);

  it("forwards the cancel", async () => {
    const fetchMock = armBff([job("CANCELLED")]);
    const response = await CANCEL(
      bffRequest("/api/demo/jobs/job-1/cancel", { method: "POST" }),
      ctx("job-1"),
    );
    expect(response.status).toBe(200);
    expect(sentUrl(fetchMock)).toBe("https://api.example/v1/jobs/job-1/cancel");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect((await response.json()).state).toBe("CANCELLED");
  });

  it("passes a 409 job_terminal envelope through", async () => {
    armBff([envelope("job_terminal", 409)]);
    const response = await CANCEL(
      bffRequest("/api/demo/jobs/job-1/cancel", { method: "POST" }),
      ctx("job-1"),
    );
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("job_terminal");
  });

  it("returns 404 when demo mode is off", async () => {
    armBff([], false);
    const response = await CANCEL(
      bffRequest("/api/demo/jobs/job-1/cancel", { method: "POST" }),
      ctx("job-1"),
    );
    expect(response.status).toBe(404);
  });
});
