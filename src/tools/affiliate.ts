import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { idParam, paginationQuery } from '../schemas.js';

export function registerAffiliateTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-affiliate-commissions',
    {
      title: 'List affiliate commissions',
      description: 'Paginated commissions. search matches order_nr. Use get-affiliate-commission for rejection reasons.',
      inputSchema: z.object(paginationQuery),
      annotations: annotations.readOnly,
    },
    async (query) =>
      runTool(() => client.request({ method: 'GET', path: '/affiliate/commissions/', query })),
  );

  server.registerTool(
    'get-affiliate-commission',
    {
      title: 'Get affiliate commission',
      description: 'Full commission record, including rejection reason when not approved.',
      inputSchema: z.object({ id: idParam.describe('Commission id') }),
      annotations: annotations.readOnly,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'GET', path: `/affiliate/commissions/${id}` })),
  );

  server.registerTool(
    'list-affiliate-payments',
    {
      title: 'List affiliate payments',
      description: 'Paginated payouts. search matches invoice_id or payment id. Rows include invoice_nr.',
      inputSchema: z.object(paginationQuery),
      annotations: annotations.readOnly,
    },
    async (query) =>
      runTool(() => client.request({ method: 'GET', path: '/affiliate/payments/', query })),
  );

  server.registerTool(
    'get-affiliate-payment',
    {
      title: 'Get affiliate payment',
      description: 'Detail for one affiliate payout.',
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe('Payment id from list-affiliate-payments'),
      }),
      annotations: annotations.readOnly,
    },
    async ({ id }) =>
      runTool(() =>
        client.request({ method: 'GET', path: `/affiliate/payments/${encodeURIComponent(String(id))}` }),
      ),
  );
}
