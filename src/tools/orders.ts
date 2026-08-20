import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const orderProfile = z
  .object({
    owner: z.number().int().optional().describe("Owner profile ID."),
    admin: z.number().int().optional().describe("Admin profile ID."),
    tech: z.number().int().optional().describe("Tech profile ID."),
    billing: z.number().int().optional().describe("Billing profile ID."),
    reseller: z.number().int().optional().describe("Reseller profile ID."),
  })
  .optional()
  .describe("Optional nested contact profile IDs. Empty uses the default profile.");

export function registerOrderTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "create-order",
    {
      description:
        "Register or transfer a domain (POST /domains/order). Executes immediately and charges the account. Premium domains require accept_premium_price matching the availability endpoint.",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        domain: z.string().describe("Domain with TLD."),
        type: z
          .enum(["register", "transfer"])
          .describe("Order type: register or transfer."),
        transfer_code: z
          .string()
          .optional()
          .describe("EPP/auth code. Required when type is transfer."),
        accept_premium_price: z
          .number()
          .optional()
          .describe(
            "Premium registration price (ex. VAT) you accept. Must match the availability endpoint.",
          ),
        nameserver: z
          .string()
          .optional()
          .describe("Nameserver profile alias. Empty uses the default profile."),
        dns_template_id: z
          .number()
          .int()
          .optional()
          .describe("DNS template ID when using mijn.host nameservers."),
        profile: orderProfile,
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/domains/order",
        body: compactBody(input),
      }),
  );

  registerJsonTool(
    server,
    "list-orders",
    {
      description: "List open orders (GET /orders/).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/orders/" }),
  );

  registerJsonTool(
    server,
    "get-order",
    {
      description: "Get an open order (GET /orders/{order_id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        order_id: z.union([z.string(), z.number()]).describe("Order ID."),
      }),
    },
    async (input) =>
      client.request({ path: `/orders/${encodePathSegment(input.order_id)}` }),
  );

  registerJsonTool(
    server,
    "update-order",
    {
      description:
        "Update a cart item and reprocess an order (PUT /orders/{order_id}).",
      inputSchema: z.object({
        order_id: z.union([z.string(), z.number()]).describe("Order ID."),
        cart_id: z.number().int().describe("Cart ID from list-orders or get-order."),
        domain: z
          .object({
            profile: orderProfile,
            nameserver: z
              .string()
              .optional()
              .describe("Nameserver profile alias (e.g. default-mijnhost)."),
            dns_template_id: z.number().int().optional().describe("DNS template ID."),
            transfer_code: z.string().optional().describe("Domain transfer code."),
          })
          .optional()
          .describe("Domain order updates."),
        hosting: z
          .object({
            domain: z.string().describe("Domain connected to the ordered hosting plan."),
          })
          .optional()
          .describe("Hosting order updates."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/orders/${encodePathSegment(input.order_id)}`,
        body: compactBody({
          cart_id: input.cart_id,
          domain: input.domain,
          hosting: input.hosting,
        }),
      }),
  );
}
