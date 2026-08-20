import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';

export function registerWhoamiTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'whoami',
    {
      title: 'Who am I',
      description:
        'Return the outbound public IP and mijn.host customer number for this API key. Use first when debugging 401 whitelist errors or to confirm which account the key belongs to.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/whoami' })),
  );
}
