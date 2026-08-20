import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { encodePathSegment, registerJsonTool } from "./_shared.js";

const domainName = z
  .string()
  .min(1)
  .describe("Domain name including TLD (e.g. example.com).");

const dnsRecord = z.object({
  type: z.string().describe("DNS record type (A, AAAA, CNAME, MX, TXT, …)."),
  name: z.string().describe("Record name (FQDN, typically ending with a dot)."),
  value: z.string().describe("Record value / rdata."),
  ttl: z.number().int().describe("TTL in seconds."),
});

export function registerDnsTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "list-dns-records",
    {
      description: "List DNS records for a domain (GET /domains/{domain}/dns).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({ path: `/domains/${encodePathSegment(input.domain)}/dns` }),
  );

  registerJsonTool(
    server,
    "replace-dns-records",
    {
      description:
        "Replace all DNS records of a domain (PUT /domains/{domain}/dns). The sent records become the complete zone.",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        domain: domainName,
        records: z.array(dnsRecord).describe("Complete set of DNS records."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/domains/${encodePathSegment(input.domain)}/dns`,
        body: { records: input.records },
      }),
  );

  registerJsonTool(
    server,
    "update-dns-record",
    {
      description:
        "Update a single DNS record (PATCH /domains/{domain}/dns). The record is identified by type, name, value, and ttl.",
      inputSchema: z.object({
        domain: domainName,
        record: dnsRecord.describe("DNS record to update."),
      }),
    },
    async (input) =>
      client.request({
        method: "PATCH",
        path: `/domains/${encodePathSegment(input.domain)}/dns`,
        body: { record: input.record },
      }),
  );

  registerJsonTool(
    server,
    "delete-dns-record",
    {
      description:
        "Delete a single DNS record identified by type, name, and value (DELETE /domains/{domain}/dns). If the rrset has other values they are kept.",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        domain: domainName,
        record: z
          .object({
            type: z.string().describe("DNS record type."),
            name: z.string().describe("Record name."),
            value: z.string().describe("Record value to remove."),
          })
          .describe("DNS record to delete."),
      }),
    },
    async (input) =>
      client.request({
        method: "DELETE",
        path: `/domains/${encodePathSegment(input.domain)}/dns`,
        body: { record: input.record },
      }),
  );

  registerJsonTool(
    server,
    "get-dns-zonefile",
    {
      description:
        "Retrieve the BIND-style zonefile for a domain (GET /domains/{domain}/dns/zone). data.zone is a JSON string with \\n/\\t escapes. Not available when DNS is managed through Cloudflare.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({
        path: `/domains/${encodePathSegment(input.domain)}/dns/zone`,
      }),
  );

  registerJsonTool(
    server,
    "import-dns-zonefile",
    {
      description:
        "Replace all DNS records from a BIND zonefile (PUT /domains/{domain}/dns/zone). Send { zone } as JSON; SOA and apex NS lines are ignored. Not available when DNS is managed through Cloudflare.",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        domain: domainName,
        zone: z
          .string()
          .describe(
            "BIND zonefile as a string. Lines are read as `name ttl IN type rdata`.",
          ),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/domains/${encodePathSegment(input.domain)}/dns/zone`,
        body: { zone: input.zone },
      }),
  );
}
