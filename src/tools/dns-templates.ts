import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const templateRecord = z.object({
  type: z.string().describe("DNS record type."),
  name: z.string().optional().describe("DNS record name (relative or empty for apex)."),
  value: z.string().describe("DNS record value."),
  ttl: z.number().int().optional().describe("DNS record TTL."),
  priority: z.number().int().optional().describe("DNS record priority (MX)."),
});

export function registerDnsTemplateTools(
  server: McpServer,
  client: MijnHostClient,
): void {
  registerJsonTool(
    server,
    "list-dns-templates",
    {
      description: "List DNS templates (GET /domains/dns-templates).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/domains/dns-templates" }),
  );

  registerJsonTool(
    server,
    "get-dns-template",
    {
      description: "Get a DNS template (GET /domains/dns-templates/{id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("DNS template ID."),
      }),
    },
    async (input) =>
      client.request({
        path: `/domains/dns-templates/${encodePathSegment(input.id)}`,
      }),
  );

  registerJsonTool(
    server,
    "create-dns-template",
    {
      description: "Create a DNS template (POST /domains/dns-templates).",
      inputSchema: z.object({
        alias: z.string().describe("Template name."),
        default: z.boolean().describe("Whether this is the default template for new orders."),
        records: z.array(templateRecord).describe("Template DNS records."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/domains/dns-templates",
        body: {
          alias: input.alias,
          default: input.default,
          records: input.records,
        },
      }),
  );

  registerJsonTool(
    server,
    "update-dns-template",
    {
      description: "Update a DNS template (PUT /domains/dns-templates/{id}).",
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("DNS template ID."),
        alias: z.string().optional().describe("Template name."),
        default: z.boolean().optional().describe("Default template for new orders."),
        records: z.array(templateRecord).optional().describe("Template DNS records."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/domains/dns-templates/${encodePathSegment(input.id)}`,
        body: compactBody({
          alias: input.alias,
          default: input.default,
          records: input.records,
        }) ?? {},
      }),
  );

  registerJsonTool(
    server,
    "delete-dns-template",
    {
      description: "Delete a DNS template (DELETE /domains/dns-templates/{id}).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("DNS template ID."),
      }),
    },
    async (input) =>
      client.request({
        method: "DELETE",
        path: `/domains/dns-templates/${encodePathSegment(input.id)}`,
      }),
  );
}
