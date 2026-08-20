import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { idParam, templateDnsRecord } from '../schemas.js';

export function registerTemplateTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-dns-templates',
    {
      title: 'List DNS templates',
      description: 'List DNS templates used for new domains on mijn.host nameservers.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/domains/dns-templates' })),
  );

  server.registerTool(
    'create-dns-template',
    {
      title: 'Create DNS template',
      description:
        'Create a DNS template. MX uses a separate priority field (unlike live DNS, where priority lives in value).',
      inputSchema: z.object({
        alias: z.string().describe('Template name'),
        default: z.boolean().describe('Use as default for new domain orders'),
        records: z.array(templateDnsRecord).min(1),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/domains/dns-templates', body })),
  );

  server.registerTool(
    'get-dns-template',
    {
      title: 'Get DNS template',
      description: 'Get one DNS template by id.',
      inputSchema: z.object({ id: idParam.describe('DNS template id') }),
      annotations: annotations.readOnly,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'GET', path: `/domains/dns-templates/${id}` })),
  );

  server.registerTool(
    'update-dns-template',
    {
      title: 'Update DNS template',
      description: 'Update alias, default flag, and/or records of a DNS template.',
      inputSchema: z.object({
        id: idParam.describe('DNS template id'),
        alias: z.string().optional(),
        default: z.boolean().optional(),
        records: z.array(templateDnsRecord).optional(),
      }),
      annotations: annotations.write,
    },
    async ({ id, ...body }) =>
      runTool(() => client.request({ method: 'PUT', path: `/domains/dns-templates/${id}`, body })),
  );

  server.registerTool(
    'delete-dns-template',
    {
      title: 'Delete DNS template',
      description: 'Delete a DNS template by id.',
      inputSchema: z.object({ id: idParam.describe('DNS template id') }),
      annotations: annotations.destructive,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'DELETE', path: `/domains/dns-templates/${id}` })),
  );
}
