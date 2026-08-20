import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { contactRoleIds, domainParam } from '../schemas.js';

export function registerDomainTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-domains',
    {
      title: 'List domains',
      description:
        'List all domains on the account (id, name, renewal_date, status, tags). Optionally filter by comma-separated tags.',
      inputSchema: z.object({
        tags: z
          .string()
          .optional()
          .describe('Comma-separated tags, e.g. project1,project2'),
      }),
      annotations: annotations.readOnly,
    },
    async ({ tags }) =>
      runTool(() => client.request({ method: 'GET', path: '/domains', query: { tags } })),
  );

  server.registerTool(
    'get-domain',
    {
      title: 'Get domain',
      description:
        'Get one domain: lock, DNSSEC, nameservers, managed_dns, handles, forwarder, tags, and status. Use before changing DNS or nameservers.',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.readOnly,
    },
    async ({ domain }) =>
      runTool(() => client.request({ method: 'GET', path: `/domains/${encodeURIComponent(domain)}` })),
  );

  server.registerTool(
    'update-domain',
    {
      title: 'Update domain',
      description:
        'Update nameservers, lock, DNSSEC, contact handles, URL forwarder, or tags. Omit keys you do not want to change. nameserver (profile alias) and nameservers (explicit list) are mutually exclusive. Use nameserver "default-mijnhost" to return to mijn.host DNS. Our nsX.mijn.host hostnames are rejected in nameservers.',
      inputSchema: z.object({
        domain: domainParam,
        nameserver: z
          .string()
          .optional()
          .describe('Nameserver profile alias, e.g. default-mijnhost. Mutually exclusive with nameservers.'),
        nameservers: z
          .array(
            z.union([
              z.string().describe('Nameserver hostname'),
              z.object({
                hostname: z.string(),
                ipv4: z.string().optional().describe('Glue IPv4 for in-bailiwick hosts'),
                ipv6: z.string().optional().describe('Glue IPv6 for in-bailiwick hosts'),
              }),
            ]),
          )
          .optional()
          .describe('Explicit nameserver list. Mutually exclusive with nameserver.'),
        is_locked: z.boolean().optional().describe('Registrar lock, if the TLD supports it'),
        dnssec: z
          .object({
            enabled: z
              .boolean()
              .optional()
              .describe('false removes all DNSSEC keys. true or omitted with key fields sets/updates keys.'),
            flags: z.union([z.literal(256), z.literal(257)]).optional(),
            alg: z
              .union([
                z.literal(6),
                z.literal(8),
                z.literal(10),
                z.literal(12),
                z.literal(13),
                z.literal(15),
                z.literal(16),
              ])
              .optional(),
            protocol: z.literal(3).optional(),
            pubKey: z.string().optional().describe('DNSSEC public key. Required when enabling/updating keys.'),
          })
          .optional(),
        profile: contactRoleIds.describe('Contact profile ids for owner/admin/tech/billing/reseller'),
        forwarder: z
          .object({
            enabled: z.boolean().describe('false disables the forwarder; true requires type and url'),
            type: z.union([z.literal(301), z.literal(302), z.literal(303)]).optional(),
            url: z.string().optional().describe('Redirect target URL when enabled is true'),
          })
          .optional(),
        tags: z
          .array(z.string())
          .optional()
          .describe('Replaces the full tag set when sent. [] clears all. Lowercase [a-z0-9._-].'),
      }),
      annotations: annotations.write,
    },
    async ({ domain, ...body }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/domains/${encodeURIComponent(domain)}`,
          body,
        }),
      ),
  );

  server.registerTool(
    'cancel-domain',
    {
      title: 'Cancel domain',
      description:
        'Schedule domain cancellation before the next renewal date. Destructive. Use cancel-domain-deletion to undo if still pending.',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.destructive,
    },
    async ({ domain }) =>
      runTool(() =>
        client.request({ method: 'DELETE', path: `/domains/${encodeURIComponent(domain)}` }),
      ),
  );

  server.registerTool(
    'cancel-domain-deletion',
    {
      title: 'Undo domain cancellation',
      description: 'Restore a domain that is scheduled for deletion / cancellation.',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.writeIdempotent,
    },
    async ({ domain }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/domains/${encodeURIComponent(domain)}/cancel-delete`,
        }),
      ),
  );

  server.registerTool(
    'get-domain-auth-code',
    {
      title: 'Get domain auth code',
      description:
        'Retrieve the EPP/auth code for an outbound transfer. Unlock the domain first with update-domain is_locked=false if the registry requires it.',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.readOnly,
    },
    async ({ domain }) =>
      runTool(() =>
        client.request({
          method: 'GET',
          path: `/domains/${encodeURIComponent(domain)}/auth-code`,
        }),
      ),
  );

  server.registerTool(
    'check-domain-availability',
    {
      title: 'Check domain availability',
      description:
        'Check whether a domain can be registered or transferred. For premium names, read is_premium and premium_price.register — you must send that amount as accept_premium_price on order-domain. This endpoint is rate-limited (429).',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.readOnly,
    },
    async ({ domain }) =>
      runTool(() =>
        client.request({
          method: 'GET',
          path: `/domains/availability/${encodeURIComponent(domain)}`,
        }),
      ),
  );
}
