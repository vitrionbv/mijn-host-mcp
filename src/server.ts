import { McpServer } from '@modelcontextprotocol/server';
import { createClientFromEnv, type MijnHostClient } from './client.js';
import { registerAllTools } from './tools/index.js';
import { PACKAGE_VERSION, SERVER_NAME } from './version.js';

export { MijnHostClient, createClientFromEnv } from './client.js';
export { TOOL_NAMES } from './tools/index.js';
export type { MijnHostClientOptions } from './client.js';

export interface CreateServerOptions {
  client?: MijnHostClient;
}

const instructions = `mijn.host MCP server — manage domains, DNS, contacts, orders, VPS, certificates, account, tickets, and affiliate via API v2.

Authentication: MIJN_HOST_API_KEY (header API-Key). Optional MIJN_HOST_BASE_URL (default https://mijn.host/api/v2).
If a call fails with an IP whitelist error, run whoami and add that IP in the control panel.

Safety:
- Prefer update-dns-record / delete-dns-record. replace-dns-records and import-dns-zone wipe the whole zone.
- Live DNS MX value is "10 mail.example.com." (priority inside value). DNS templates use a separate priority field.
- order-domain and order-certificate charge the account immediately. Confirm with the user first.
- Check check-domain-availability (and premium_price) before ordering. Premium names need accept_premium_price.
- Destructive tools: cancel-domain, delete-* , VPS poweroff/reinstall/restore/password reset.

There is no explicit renew endpoint; cancellation stops renewal, cancel-domain-deletion undoes it.`;

export function createServer(options: CreateServerOptions = {}): McpServer {
  const client = options.client ?? createClientFromEnv();
  const server = new McpServer({
    name: SERVER_NAME,
    version: PACKAGE_VERSION,
    description: instructions,
  });
  registerAllTools(server, client);
  return server;
}
