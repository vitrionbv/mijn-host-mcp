import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { registerJsonTool } from "./_shared.js";

export function registerWhoamiTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "get-whoami",
    {
      description:
        "Return the public IP of this request and the customer number for the API key (GET /whoami). Useful for API key whitelist / DNS records.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/whoami" }),
  );
}
