import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const nameserverItem = z.object({
  hostname: z
    .string()
    .describe("Nameserver hostname. nsX.mijn.host / nsX.webhost.company cannot be used."),
  ipv4: z.string().describe("IPv4 address of the nameserver."),
  ipv6: z.string().optional().describe("IPv6 address of the nameserver."),
});

export function registerNameserverTools(
  server: McpServer,
  client: MijnHostClient,
): void {
  registerJsonTool(
    server,
    "list-nameserver-profiles",
    {
      description: "List nameserver profiles (GET /domains/nameservers).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/domains/nameservers" }),
  );

  registerJsonTool(
    server,
    "get-nameserver-profile",
    {
      description: "Get a nameserver profile by alias (GET /domains/nameservers/{alias}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        alias: z.string().describe("Nameserver profile alias."),
      }),
    },
    async (input) =>
      client.request({
        path: `/domains/nameservers/${encodePathSegment(input.alias)}`,
      }),
  );

  registerJsonTool(
    server,
    "create-nameserver-profile",
    {
      description: "Create a nameserver profile (POST /domains/nameservers).",
      inputSchema: z.object({
        alias: z.string().describe("Profile name."),
        nameservers: z.array(nameserverItem).describe("Nameserver list."),
        set_as_default: z
          .boolean()
          .optional()
          .describe("Set this profile as default for new domain orders."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/domains/nameservers",
        body: compactBody({
          alias: input.alias,
          nameservers: input.nameservers,
          set_as_default: input.set_as_default,
        }),
      }),
  );

  registerJsonTool(
    server,
    "update-nameserver-profile",
    {
      description: "Update a nameserver profile (PUT /domains/nameservers/{alias}).",
      inputSchema: z.object({
        alias: z.string().describe("Nameserver profile alias to update."),
        nameservers: z.array(nameserverItem).optional().describe("Nameserver list."),
        set_as_default: z
          .boolean()
          .optional()
          .describe("Set this profile as default for new domain orders."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/domains/nameservers/${encodePathSegment(input.alias)}`,
        body: compactBody({
          nameservers: input.nameservers,
          set_as_default: input.set_as_default,
        }) ?? {},
      }),
  );

  registerJsonTool(
    server,
    "delete-nameserver-profile",
    {
      description: "Delete a nameserver profile (DELETE /domains/nameservers/{alias}).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        alias: z.string().describe("Nameserver profile alias."),
      }),
    },
    async (input) =>
      client.request({
        method: "DELETE",
        path: `/domains/nameservers/${encodePathSegment(input.alias)}`,
      }),
  );
}
