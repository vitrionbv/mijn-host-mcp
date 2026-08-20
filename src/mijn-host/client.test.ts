import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BASE_URL, MijnHostClient, USER_AGENT } from "./client.js";
import { MijnHostRateLimitError, MijnHostUnauthorizedError } from "./errors.js";

const API_KEY = "test-mijn-host-key";

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...Object.fromEntries(new Headers(init.headers).entries()),
    },
  });
}

describe("MijnHostClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete process.env.MIJN_HOST_API_KEY;
    delete process.env.MIJNHOST_API_KEY;
  });

  it("sends API-Key, Accept, Content-Type, and User-Agent headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: 200, data: [] }),
    );

    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });
    await client.request({ path: "/domains" });

    expect(fetchImpl).toHaveBeenCalledWith(`${BASE_URL}/domains`, {
      method: "GET",
      headers: {
        "API-Key": API_KEY,
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": USER_AGENT,
      },
      body: undefined,
    });
    expect(USER_AGENT).toMatch(/^@vitrion\/mijn-host-mcp\/\d+\.\d+\.\d+$/);
  });

  it("reads MIJNHOST_API_KEY as an alias", async () => {
    process.env.MIJNHOST_API_KEY = API_KEY;
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: 200 }));
    const client = new MijnHostClient({ fetchImpl });
    await client.request({ path: "/whoami" });

    const headers = fetchImpl.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers["API-Key"]).toBe(API_KEY);
  });

  it("throws when no API key is configured", () => {
    expect(() => new MijnHostClient({ fetchImpl: vi.fn() as typeof fetch })).toThrow(
      "MIJN_HOST_API_KEY environment variable is required",
    );
  });

  it("does not include the API key in constructor error messages", () => {
    try {
      new MijnHostClient({ fetchImpl: vi.fn() as typeof fetch });
      throw new Error("expected constructor to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toContain(API_KEY);
      expect(message.toLowerCase()).not.toContain("secret");
    }
  });

  it("returns parsed JSON", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({
        status: 200,
        status_description: "Request successful",
        data: { domain: "example.com" },
      }),
    );

    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });
    const result = await client.request({ path: "/domains/example.com" });

    expect(result).toEqual({
      status: 200,
      status_description: "Request successful",
      data: { domain: "example.com" },
    });
  });

  it("sends JSON bodies for write requests", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ status: 200 }));
    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });

    await client.request({
      method: "PUT",
      path: "/domains/example.com/dns",
      body: { records: [{ type: "A", name: "example.com.", value: "1.2.3.4", ttl: 900 }] },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      `${BASE_URL}/domains/example.com/dns`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          records: [{ type: "A", name: "example.com.", value: "1.2.3.4", ttl: 900 }],
        }),
      }),
    );
  });

  it("returns base64 for PDF responses", async () => {
    const pdf = Buffer.from("%PDF-1.4 test");
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(pdf, {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    );

    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });
    const result = await client.request({
      path: "/account/invoices/2026-1/pdf",
      accept: "application/pdf",
    });

    expect(result).toEqual({
      contentType: "application/pdf",
      encoding: "base64",
      data: pdf.toString("base64"),
    });
  });

  it("retries once on 429 and succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ status_description: "Too Many Requests" }), {
          status: 429,
          headers: { "Retry-After": "2" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ status: 200, data: [] }));

    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });
    const requestPromise = client.request({ path: "/domains" });

    await vi.runAllTimersAsync();
    const result = await requestPromise;

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ status: 200, data: [] });
  });

  it("throws MijnHostRateLimitError when retry still returns 429", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status_description: "Too Many Requests" }), {
        status: 429,
        headers: { "Retry-After": "1" },
      }),
    );

    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });
    const assertion = expect(
      client.request({ path: "/domains" }),
    ).rejects.toBeInstanceOf(MijnHostRateLimitError);

    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("maps 401 to MijnHostUnauthorizedError using status_description", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: 401, status_description: "No valid API key set" }, { status: 401 }),
    );

    const client = new MijnHostClient({ apiKey: API_KEY, fetchImpl });
    await expect(client.request({ path: "/domains" })).rejects.toBeInstanceOf(
      MijnHostUnauthorizedError,
    );
  });
});
