import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { idParam, limit, page } from '../schemas.js';

export function registerCertificateTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-certificates',
    {
      title: 'List certificates',
      description:
        'List SSL certificates. Packages that are bought but not requested yet have requested=false and an empty domain — call request-certificate next.',
      inputSchema: z.object({ page, limit }),
      annotations: annotations.readOnly,
    },
    async (query) => runTool(() => client.request({ method: 'GET', path: '/certificates/', query })),
  );

  server.registerTool(
    'list-certificate-products',
    {
      title: 'List certificate products',
      description: 'List purchasable SSL packages (product_id, prices, duration_options) for order-certificate.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/certificates/products' })),
  );

  server.registerTool(
    'get-certificate',
    {
      title: 'Get certificate',
      description:
        'Get one certificate. After request-certificate, poll until certificate_status is ACT, then read certificate and intermediate_certificate. Pending validation is in validation. The private key is never returned.',
      inputSchema: z.object({ id: idParam.describe('Certificate id') }),
      annotations: annotations.readOnly,
    },
    async ({ id }) => runTool(() => client.request({ method: 'GET', path: `/certificates/${id}` })),
  );

  server.registerTool(
    'generate-csr',
    {
      title: 'Generate CSR and private key',
      description:
        'Generate a CSR + private key. Send csr to request-certificate. The private_key is returned ONCE and is not stored — keep it for installation. You may also bring your own CSR.',
      inputSchema: z.object({
        common_name: z.string().describe('Domain. Use *.example.com for a wildcard package.'),
        organization: z.string(),
        email: z.string(),
        country: z.string().length(2).describe('Two-letter country code'),
        state: z.string().describe('Province or state'),
        locality: z.string().describe('City'),
        unit: z.string().optional().describe('Organizational unit'),
        bits: z.number().int().optional().describe('Key size in bits. Defaults to 2048.'),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/certificates/csr', body })),
  );

  server.registerTool(
    'order-certificate',
    {
      title: 'Order certificate package',
      description:
        'BILLS IMMEDIATELY. Buys an SSL package only (requested=false). Then call request-certificate with a CSR. duration must be one of the product duration_options (default 1 year).',
      inputSchema: z.object({
        product_id: z.number().int().positive().describe('Product id from list-certificate-products'),
        duration: z.number().int().positive().optional().describe('Contract years. Defaults to 1.'),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/certificates/order', body })),
  );

  server.registerTool(
    'request-certificate',
    {
      title: 'Request issued certificate',
      description:
        'Request the actual certificate for a purchased package. Poll get-certificate afterwards. auto_setup_dns only works with validation_method dns when the domain is in-account on mijn.host nameservers. If auto DNS fails the cert is still requested and a warning is returned.',
      inputSchema: z.object({
        id: idParam.describe('Certificate package id'),
        profile_id: z.number().int().positive().describe('Contact profile id from list-contact-profiles'),
        csr: z.string().describe('PEM CSR. Common name must match the certificate domain.'),
        validation_method: z.enum(['dns', 'http', 'https', 'email']),
        approver_email: z.string().describe('Used as the approver when validation_method is email'),
        private_key: z
          .string()
          .optional()
          .describe('Optional PEM key to store with the certificate. Never returned again.'),
        auto_setup_dns: z
          .boolean()
          .optional()
          .describe('Publish the DNS validation CNAME automatically (dns method + managed DNS only).'),
      }),
      annotations: annotations.write,
    },
    async ({ id, ...body }) =>
      runTool(() => client.request({ method: 'POST', path: `/certificates/${id}/request`, body })),
  );
}
