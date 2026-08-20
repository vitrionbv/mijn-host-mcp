import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { contactProfileCreate, contactProfileUpdate, idParam } from '../schemas.js';

export function registerContactTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-contact-profiles',
    {
      title: 'List contact profiles',
      description: 'List domain contact / handle profiles. Use the numeric id on orders and update-domain.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/domains/contacts' })),
  );

  server.registerTool(
    'create-contact-profile',
    {
      title: 'Create contact profile',
      description:
        'Create a registrant/admin/tech/billing contact. Required: name plus profile firstname, lastname, street, street_number, zipcode, city, country, email, phone_*, and defaults.',
      inputSchema: z.object({
        name: z.string().describe('Profile alias shown in the control panel'),
        profile: contactProfileCreate,
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/domains/contacts', body })),
  );

  server.registerTool(
    'get-contact-profile',
    {
      title: 'Get contact profile',
      description: 'Get one contact profile by numeric id.',
      inputSchema: z.object({ id: idParam.describe('Contact profile id') }),
      annotations: annotations.readOnly,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'GET', path: `/domains/contacts/${id}` })),
  );

  server.registerTool(
    'update-contact-profile',
    {
      title: 'Update contact profile',
      description:
        'Update an existing contact. Omitted fields stay unchanged. firstname/lastname/company_name cannot be changed via the API.',
      inputSchema: z.object({
        id: idParam.describe('Contact profile id'),
        name: z.string().optional().describe('New profile alias'),
        profile: contactProfileUpdate,
      }),
      annotations: annotations.write,
    },
    async ({ id, ...body }) =>
      runTool(() => client.request({ method: 'PUT', path: `/domains/contacts/${id}`, body })),
  );

  server.registerTool(
    'delete-contact-profile',
    {
      title: 'Delete contact profile',
      description: 'Delete a contact profile. Fails if it is still attached to domains.',
      inputSchema: z.object({ id: idParam.describe('Contact profile id') }),
      annotations: annotations.destructive,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'DELETE', path: `/domains/contacts/${id}` })),
  );
}
