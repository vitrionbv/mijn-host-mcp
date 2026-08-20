import { describe, expect, it, vi } from "vitest";
import { McpServer } from "@modelcontextprotocol/server";
import { MijnHostClient } from "../mijn-host/client.js";
import { registerDomainTools } from "./domains.js";
import { registerDnsTools } from "./dns.js";
import { registerOrderTools } from "./orders.js";

function createHarness() {
  const fetchImpl = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ status: 200, data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
  const client = new MijnHostClient({ apiKey: "test-key", fetchImpl });
  const server = new McpServer({ name: "test", version: "0.0.0" });
  registerDomainTools(server, client);
  registerDnsTools(server, client);
  registerOrderTools(server, client);
  return { server, fetchImpl };
}

async function callTool(
  server: McpServer,
  name: string,
  args: Record<string, unknown>,
): Promise<void> {
  const tools = (
    server as unknown as {
      _registeredTools?: Record<
        string,
        {
          handler?: (input: Record<string, unknown>) => Promise<unknown>;
          callback?: (input: Record<string, unknown>) => Promise<unknown>;
        }
      >;
    }
  )._registeredTools;

  const tool = tools?.[name];
  const invoke = tool?.handler ?? tool?.callback;
  if (!invoke) {
    throw new Error(`Tool not found: ${name}`);
  }
  await invoke(args);
}

describe("domain and DNS tools", () => {
  it("list-domains sends the tags query", async () => {
    const { server, fetchImpl } = createHarness();
    await callTool(server, "list-domains", { tags: "project1,project2" });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mijn.host/api/v2/domains?tags=project1%2Cproject2",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("replace-dns-records PUTs the records body", async () => {
    const { server, fetchImpl } = createHarness();
    await callTool(server, "replace-dns-records", {
      domain: "example.com",
      records: [{ type: "A", name: "example.com.", value: "1.2.3.4", ttl: 900 }],
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mijn.host/api/v2/domains/example.com/dns",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          records: [{ type: "A", name: "example.com.", value: "1.2.3.4", ttl: 900 }],
        }),
      }),
    );
  });

  it("update-dns-record uses PATCH", async () => {
    const { server, fetchImpl } = createHarness();
    await callTool(server, "update-dns-record", {
      domain: "example.com",
      record: { type: "A", name: "example.com.", value: "9.9.9.9", ttl: 300 },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mijn.host/api/v2/domains/example.com/dns",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("delete-dns-record DELETEs with a record body", async () => {
    const { server, fetchImpl } = createHarness();
    await callTool(server, "delete-dns-record", {
      domain: "example.com",
      record: { type: "A", name: "example.com.", value: "1.2.3.4" },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mijn.host/api/v2/domains/example.com/dns",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({
          record: { type: "A", name: "example.com.", value: "1.2.3.4" },
        }),
      }),
    );
  });

  it("create-order posts to /domains/order", async () => {
    const { server, fetchImpl } = createHarness();
    await callTool(server, "create-order", {
      domain: "example.com",
      type: "register",
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mijn.host/api/v2/domains/order",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ domain: "example.com", type: "register" }),
      }),
    );
  });

  it("update-domain can set lock, tags, and DNSSEC", async () => {
    const { server, fetchImpl } = createHarness();
    await callTool(server, "update-domain", {
      domain: "example.com",
      is_locked: true,
      tags: ["prod"],
      dnssec: { enabled: false },
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://mijn.host/api/v2/domains/example.com",
      expect.objectContaining({ method: "PUT" }),
    );
    const body = JSON.parse(
      (fetchImpl.mock.calls[0]?.[1] as { body?: string })?.body ?? "{}",
    ) as Record<string, unknown>;
    expect(body).toEqual({
      is_locked: true,
      dnssec: { enabled: false },
      tags: ["prod"],
    });
  });
});
