import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { encodePathSegment, registerJsonTool } from "./_shared.js";

const pageQuery = {
  page: z.number().int().positive().optional().describe("Page (1-based)."),
  limit: z.number().int().positive().max(100).optional().describe("Page size. Max 100."),
  search: z.string().optional().describe("Optional search/filter string."),
};

export function registerExtensionTools(
  server: McpServer,
  client: MijnHostClient,
): void {
  registerJsonTool(
    server,
    "list-domain-extensions",
    {
      description:
        "List TLDs with register, renew, and transfer prices (GET /domains/extensions/).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object(pageQuery),
    },
    async (input) =>
      client.request({
        path: "/domains/extensions/",
        query: {
          page: input.page,
          limit: input.limit,
          search: input.search,
        },
      }),
  );

  registerJsonTool(
    server,
    "get-domain-extension",
    {
      description:
        "Get pricing, features, and registry requirements for one TLD (GET /domains/extensions/{extension}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        extension: z.string().describe("TLD / extension (e.g. com or .nl)."),
      }),
    },
    async (input) =>
      client.request({
        path: `/domains/extensions/${encodePathSegment(input.extension)}`,
      }),
  );
}
