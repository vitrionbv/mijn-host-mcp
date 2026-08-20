import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { contactRoleIds, domainParam } from '../schemas.js';

export function registerOrderTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'order-domain',
    {
      title: 'Order domain (register or transfer)',
      description:
        'BILLS IMMEDIATELY. Register or transfer a domain. Check check-domain-availability first. For premium domains you MUST send accept_premium_price matching premium_price.register (ex VAT). Transfers usually need transfer_code. Then poll list-orders / get-order.',
      inputSchema: z.object({
        domain: domainParam,
        type: z.enum(['register', 'transfer']).describe('register a new name or transfer an existing one'),
        transfer_code: z.string().optional().describe('EPP/auth code. Required for most transfers.'),
        accept_premium_price: z
          .number()
          .optional()
          .describe('Premium registration price ex VAT from check-domain-availability. Required for premium names.'),
        nameserver: z.string().optional().describe('Nameserver profile alias. Empty uses the account default.'),
        dns_template_id: z
          .number()
          .int()
          .optional()
          .describe('DNS template id when using mijn.host nameservers'),
        profile: contactRoleIds.describe('Contact profile ids. Empty uses account defaults.'),
      }),
      annotations: annotations.write,
    },
    async (body) =>
      runTool(() => client.request({ method: 'POST', path: '/domains/order', body })),
  );

  server.registerTool(
    'list-orders',
    {
      title: 'List open orders',
      description: 'List open orders and per-service errors. Use after order-domain if registration/transfer fails.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/orders/' })),
  );

  server.registerTool(
    'get-order',
    {
      title: 'Get order',
      description: 'Get one open order, including cart items and errors.',
      inputSchema: z.object({
        order_id: z.union([z.string(), z.number()]).describe('Order id from list-orders or order-domain'),
      }),
      annotations: annotations.readOnly,
    },
    async ({ order_id }) =>
      runTool(() => client.request({ method: 'GET', path: `/orders/${encodeURIComponent(String(order_id))}` })),
  );

  server.registerTool(
    'update-order',
    {
      title: 'Update and retry order',
      description:
        'Fix a failed cart item (contacts, nameservers, transfer code, hosting domain) and re-process the order. cart_id comes from get-order / list-orders.',
      inputSchema: z.object({
        order_id: z.union([z.string(), z.number()]),
        cart_id: z.number().int().describe('Cart item id from the order'),
        domain: z
          .object({
            profile: contactRoleIds,
            nameserver: z.string().optional(),
            dns_template_id: z.number().int().optional(),
            transfer_code: z.string().optional(),
          })
          .optional(),
        hosting: z
          .object({
            domain: z.string().optional().describe('Domain attached to the hosting order'),
          })
          .optional(),
      }),
      annotations: annotations.write,
    },
    async ({ order_id, ...body }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/orders/${encodeURIComponent(String(order_id))}`,
          body,
        }),
      ),
  );
}
