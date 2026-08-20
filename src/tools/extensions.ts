import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { paginationQuery } from '../schemas.js';

export function registerExtensionTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-domain-extensions',
    {
      title: 'List domain extensions',
      description:
        'Paginated TLD list with register/renew/transfer prices. Use before quoting a registration. limit max 100.',
      inputSchema: z.object(paginationQuery),
      annotations: annotations.readOnly,
    },
    async (query) =>
      runTool(() => client.request({ method: 'GET', path: '/domains/extensions/', query })),
  );

  server.registerTool(
    'get-domain-extension',
    {
      title: 'Get domain extension',
      description:
        'Pricing, transfer_auth_code_required, dnssec_allowed, and registry requirements for one TLD (nl, com, co.uk).',
      inputSchema: z.object({
        extension: z.string().describe('TLD without a leading dot, e.g. nl or co.uk'),
      }),
      annotations: annotations.readOnly,
    },
    async ({ extension }) =>
      runTool(() =>
        client.request({
          method: 'GET',
          path: `/domains/extensions/${encodeURIComponent(extension.replace(/^\./, ''))}`,
        }),
      ),
  );
}
