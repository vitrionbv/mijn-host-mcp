import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { encodePathSegment, registerJsonTool } from "./_shared.js";

const pageQuery = z.object({
  page: z.number().int().positive().optional().describe("Page (1-based)."),
  limit: z.number().int().positive().optional().describe("Page size."),
  search: z.string().optional().describe("Optional search string."),
});

export function registerAffiliateTools(
  server: McpServer,
  client: MijnHostClient,
): void {
  registerJsonTool(
    server,
    "list-affiliate-commissions",
    {
      description: "List affiliate commissions (GET /affiliate/commissions/).",
      annotations: { readOnlyHint: true },
      inputSchema: pageQuery,
    },
    async (input) =>
      client.request({
        path: "/affiliate/commissions/",
        query: input,
      }),
  );

  registerJsonTool(
    server,
    "get-affiliate-commission",
    {
      description: "Get one affiliate commission (GET /affiliate/commissions/{id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Commission ID."),
      }),
    },
    async (input) =>
      client.request({
        path: `/affiliate/commissions/${encodePathSegment(input.id)}`,
      }),
  );

  registerJsonTool(
    server,
    "list-affiliate-payments",
    {
      description: "List affiliate payouts (GET /affiliate/payments/).",
      annotations: { readOnlyHint: true },
      inputSchema: pageQuery,
    },
    async (input) =>
      client.request({
        path: "/affiliate/payments/",
        query: input,
      }),
  );

  registerJsonTool(
    server,
    "get-affiliate-payment",
    {
      description: "Get one affiliate payout (GET /affiliate/payments/{id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Payment ID."),
      }),
    },
    async (input) =>
      client.request({
        path: `/affiliate/payments/${encodePathSegment(input.id)}`,
      }),
  );
}
