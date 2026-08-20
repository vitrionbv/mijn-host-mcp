import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const domainName = z
  .string()
  .min(1)
  .describe("Domain name including TLD (e.g. example.com).");

const contactProfileIds = z
  .object({
    owner: z.number().int().optional().describe("Owner contact profile ID."),
    admin: z.number().int().optional().describe("Admin contact profile ID."),
    tech: z.number().int().optional().describe("Tech contact profile ID."),
    billing: z.number().int().optional().describe("Billing contact profile ID."),
    reseller: z
      .number()
      .int()
      .optional()
      .describe("Reseller profile ID. For .be domains, 0 removes reseller info."),
  })
  .optional()
  .describe("Contact profile IDs (handles) for the domain.");

const nameserverEntry = z.union([
  z.string().describe("Nameserver hostname (e.g. ns1.example.com)."),
  z.object({
    hostname: z.string().describe("Nameserver hostname."),
    ipv4: z.string().optional().describe("Optional IPv4 glue (in-bailiwick only)."),
    ipv6: z.string().optional().describe("Optional IPv6 glue (in-bailiwick only)."),
  }),
]);

export function registerDomainTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "list-domains",
    {
      description:
        "List all domains on the account (GET /domains). Optional tags filter is comma-separated.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        tags: z
          .string()
          .optional()
          .describe("Filter by tag(s), comma-separated (e.g. project1,project2)."),
      }),
    },
    async (input) =>
      client.request({
        path: "/domains",
        query: { tags: input.tags },
      }),
  );

  registerJsonTool(
    server,
    "get-domain",
    {
      description:
        "Get details of a domain including lock, tags, forwarder, and DNSSEC (GET /domains/{domain}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({ path: `/domains/${encodePathSegment(input.domain)}` }),
  );

  registerJsonTool(
    server,
    "update-domain",
    {
      description:
        "Update domain settings (PUT /domains/{domain}): nameservers, lock, DNSSEC, contact handles, URL forwarder, and tags. Optional fields left empty are not updated. nameserver and nameservers are mutually exclusive.",
      inputSchema: z.object({
        domain: domainName,
        nameserver: z
          .string()
          .optional()
          .describe(
            "Saved nameserver profile alias. Use default-mijnhost for mijn.host nameservers. Mutually exclusive with nameservers.",
          ),
        nameservers: z
          .array(nameserverEntry)
          .optional()
          .describe(
            "Explicit nameserver list (hostnames or hostname+glue objects). Mutually exclusive with nameserver.",
          ),
        is_locked: z
          .boolean()
          .optional()
          .describe("Set the domain transfer lock (if the TLD supports it)."),
        dnssec: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .describe(
                "false removes all DNSSEC keys. true (or omitted with key fields) enables/updates keys and requires pubKey, flags, alg, and protocol.",
              ),
            flags: z
              .union([z.literal(256), z.literal(257)])
              .optional()
              .describe("DNSSEC flag (256 or 257)."),
            alg: z
              .union([
                z.literal(6),
                z.literal(8),
                z.literal(10),
                z.literal(12),
                z.literal(13),
                z.literal(15),
                z.literal(16),
              ])
              .optional()
              .describe("DNSSEC algorithm."),
            protocol: z.literal(3).optional().describe("DNSSEC protocol (must be 3)."),
            pubKey: z.string().optional().describe("DNSSEC public key."),
          })
          .optional()
          .describe("Set or clear DNSSEC keys at the registry."),
        profile: contactProfileIds,
        forwarder: z
          .object({
            enabled: z
              .boolean()
              .describe("false disables the forwarder; true enables or updates it."),
            type: z
              .union([z.literal(301), z.literal(302), z.literal(303)])
              .optional()
              .describe("Required when enabled is true: 301, 302, or 303."),
            url: z
              .string()
              .optional()
              .describe("Required when enabled is true: redirect target URL."),
          })
          .optional()
          .describe("URL forwarder (at most one redirect per domain)."),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            "When present, replaces the full tag set ([] clears all). Omit to leave tags unchanged. Lowercase; letters, digits, ., -, _.",
          ),
      }),
    },
    async (input) => {
      const { domain, ...rest } = input;
      return client.request({
        method: "PUT",
        path: `/domains/${encodePathSegment(domain)}`,
        body: compactBody(rest) ?? {},
      });
    },
  );

  registerJsonTool(
    server,
    "cancel-domain",
    {
      description:
        "Cancel a domain before its renewal date (DELETE /domains/{domain}).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({
        method: "DELETE",
        path: `/domains/${encodePathSegment(input.domain)}`,
      }),
  );

  registerJsonTool(
    server,
    "cancel-domain-deletion",
    {
      description:
        "Undo a pending domain cancellation (PUT /domains/{domain}/cancel-delete).",
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/domains/${encodePathSegment(input.domain)}/cancel-delete`,
      }),
  );

  registerJsonTool(
    server,
    "get-auth-code",
    {
      description: "Retrieve the EPP/auth code of a domain (GET /domains/{domain}/auth-code).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({
        path: `/domains/${encodePathSegment(input.domain)}/auth-code`,
      }),
  );

  registerJsonTool(
    server,
    "check-domain-availability",
    {
      description:
        "Check whether a domain is available and whether it is premium (GET /domains/availability/{domain}). Use data.premium_price.register with accept_premium_price on create-order.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ domain: domainName }),
    },
    async (input) =>
      client.request({
        path: `/domains/availability/${encodePathSegment(input.domain)}`,
      }),
  );
}
