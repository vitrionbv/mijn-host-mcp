import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { nameserverHost } from '../schemas.js';

const aliasParam = z.string().min(1).describe('Nameserver profile alias');

export function registerNameserverTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-nameserver-profiles',
    {
      title: 'List nameserver profiles',
      description: 'List saved nameserver profiles (aliases you can pass as nameserver on orders/domains).',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/domains/nameservers' })),
  );

  server.registerTool(
    'create-nameserver-profile',
    {
      title: 'Create nameserver profile',
      description:
        'Create a custom nameserver profile. Each host needs hostname + ipv4. Do not use nsX.mijn.host / nsX.webhost.company — use alias default-mijnhost instead.',
      inputSchema: z.object({
        alias: aliasParam,
        nameservers: z.array(nameserverHost).min(1),
        set_as_default: z.boolean().optional().describe('Use this profile for new domain orders'),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/domains/nameservers', body })),
  );

  server.registerTool(
    'get-nameserver-profile',
    {
      title: 'Get nameserver profile',
      description: 'Get one nameserver profile by alias.',
      inputSchema: z.object({ alias: aliasParam }),
      annotations: annotations.readOnly,
    },
    async ({ alias }) =>
      runTool(() =>
        client.request({ method: 'GET', path: `/domains/nameservers/${encodeURIComponent(alias)}` }),
      ),
  );

  server.registerTool(
    'update-nameserver-profile',
    {
      title: 'Update nameserver profile',
      description: 'Replace the nameserver list on an existing profile.',
      inputSchema: z.object({
        alias: aliasParam,
        nameservers: z.array(nameserverHost).min(1),
        set_as_default: z.boolean().optional(),
      }),
      annotations: annotations.write,
    },
    async ({ alias, ...body }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/domains/nameservers/${encodeURIComponent(alias)}`,
          body,
        }),
      ),
  );

  server.registerTool(
    'delete-nameserver-profile',
    {
      title: 'Delete nameserver profile',
      description: 'Delete a nameserver profile by alias.',
      inputSchema: z.object({ alias: aliasParam }),
      annotations: annotations.destructive,
    },
    async ({ alias }) =>
      runTool(() =>
        client.request({
          method: 'DELETE',
          path: `/domains/nameservers/${encodeURIComponent(alias)}`,
        }),
      ),
  );
}
