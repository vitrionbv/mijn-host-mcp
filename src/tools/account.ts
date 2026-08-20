import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { idParam, paginationQuery, userPermissions } from '../schemas.js';

export function registerAccountTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'get-account-profile',
    {
      title: 'Get account profile',
      description: 'Account name, address, phone, emails, company/VAT. company and account_type are read-only.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/account/profile/' })),
  );

  server.registerTool(
    'update-account-profile',
    {
      title: 'Update account profile',
      description:
        'Replaces the profile. Omitted keys are cleared except email_invoices and company_vat_number. Changing email sends a verification instead of updating immediately. Send the full current profile plus your edits.',
      inputSchema: z.object({
        firstname: z.string(),
        lastname: z.string(),
        address: z.string(),
        house_number: z.string(),
        zipcode: z.string(),
        city: z.string(),
        country_code: z.string(),
        phone: z
          .string()
          .describe('National number with phone_country_code, or full international e.g. +31612345678'),
        phone_country_code: z
          .string()
          .optional()
          .describe('Dialing code digits, e.g. 31. Optional if phone is international.'),
        email: z.string().describe('Must be unique. Changing it triggers verification.'),
        email_invoices: z.string().optional(),
        company_vat_number: z.string().nullable().optional(),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'PUT', path: '/account/profile/', body })),
  );

  server.registerTool(
    'list-payment-methods',
    {
      title: 'List payment methods',
      description:
        'Bank transfer and provider methods. Use an id as default_paymethod_id, or paymethod bank_transfer.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/account/paymethods/' })),
  );

  server.registerTool(
    'update-default-payment-method',
    {
      title: 'Update default payment method',
      description:
        'Set default_paymethod_id from list-payment-methods, or paymethod=bank_transfer. The latter ignores default_paymethod_id.',
      inputSchema: z.object({
        default_paymethod_id: z.string().optional(),
        paymethod: z.enum(['bank_transfer']).optional(),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'PUT', path: '/account/paymethods/', body })),
  );

  server.registerTool(
    'list-invoices',
    {
      title: 'List invoices',
      description: 'Paginated invoices with payment_status and payment_url when unpaid. search matches invoice_nr.',
      inputSchema: z.object(paginationQuery),
      annotations: annotations.readOnly,
    },
    async (query) => runTool(() => client.request({ method: 'GET', path: '/account/invoices/', query })),
  );

  server.registerTool(
    'get-invoice',
    {
      title: 'Get invoice',
      description: 'Invoice details by display invoice_nr. Download the PDF with download-invoice-pdf.',
      inputSchema: z.object({
        invoice_nr: z.number().int().positive().describe('Display invoice number'),
      }),
      annotations: annotations.readOnly,
    },
    async ({ invoice_nr }) =>
      runTool(() => client.request({ method: 'GET', path: `/account/invoices/${invoice_nr}` })),
  );

  server.registerTool(
    'download-invoice-pdf',
    {
      title: 'Download invoice PDF',
      description: 'Download an invoice PDF. Returns JSON with content_type, filename, and base64.',
      inputSchema: z.object({
        invoice_nr: z.number().int().positive().describe('Display invoice number'),
      }),
      annotations: annotations.readOnly,
    },
    async ({ invoice_nr }) =>
      runTool(() => client.request({ method: 'GET', path: `/account/invoices/${invoice_nr}/pdf` })),
  );

  server.registerTool(
    'list-account-users',
    {
      title: 'List account users',
      description: 'Paginated sub-users. search filters username/email.',
      inputSchema: z.object(paginationQuery),
      annotations: annotations.readOnly,
    },
    async (query) => runTool(() => client.request({ method: 'GET', path: '/account/users/', query })),
  );

  server.registerTool(
    'create-account-user',
    {
      title: 'Create account user',
      description:
        'Create a sub-user (max 10 new users per account per hour). Email must be unique. password_confirm defaults to password.',
      inputSchema: z.object({
        email: z.string(),
        firstname: z.string(),
        lastname: z.string(),
        password: z.string(),
        password_confirm: z.string().optional(),
        permissions: userPermissions,
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/account/users/', body })),
  );

  server.registerTool(
    'get-account-user',
    {
      title: 'Get account user',
      description: 'One sub-user and their permissions. is_main_user marks the primary contact.',
      inputSchema: z.object({ id: idParam.describe('Sub-user id') }),
      annotations: annotations.readOnly,
    },
    async ({ id }) => runTool(() => client.request({ method: 'GET', path: `/account/users/${id}` })),
  );

  server.registerTool(
    'update-account-user',
    {
      title: 'Update account user',
      description:
        'Update first/last name. If permissions is sent it REPLACES the full set for non-main users. Omit permissions to leave them unchanged.',
      inputSchema: z.object({
        id: idParam.describe('Sub-user id'),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        permissions: userPermissions,
      }),
      annotations: annotations.write,
    },
    async ({ id, ...body }) =>
      runTool(() => client.request({ method: 'PUT', path: `/account/users/${id}`, body })),
  );

  server.registerTool(
    'list-tickets',
    {
      title: 'List support tickets',
      description: 'Paginated tickets. search matches subject or ticket_number. Newest activity first.',
      inputSchema: z.object(paginationQuery),
      annotations: annotations.readOnly,
    },
    async (query) => runTool(() => client.request({ method: 'GET', path: '/account/tickets/', query })),
  );

  server.registerTool(
    'create-ticket',
    {
      title: 'Create support ticket',
      description: 'Open a support ticket. department must be support, administration, sales, public_cloud, or microsoft_365.',
      inputSchema: z.object({
        subject: z.string(),
        message: z.string().describe('Plain text or HTML; unsafe tags are stripped'),
        department: z.enum(['support', 'administration', 'sales', 'public_cloud', 'microsoft_365']),
        product_type: z.string().optional(),
        product_name: z.string().optional(),
        product_link: z.string().optional(),
      }),
      annotations: annotations.write,
    },
    async (body) => runTool(() => client.request({ method: 'POST', path: '/account/tickets/', body })),
  );

  server.registerTool(
    'get-ticket',
    {
      title: 'Get support ticket',
      description: 'Subject, status, and full HTML thread. Embedded images are removed.',
      inputSchema: z.object({
        ticket_number: z.number().int().positive(),
      }),
      annotations: annotations.readOnly,
    },
    async ({ ticket_number }) =>
      runTool(() => client.request({ method: 'GET', path: `/account/tickets/${ticket_number}` })),
  );

  server.registerTool(
    'reply-to-ticket',
    {
      title: 'Reply to support ticket',
      description: 'Add a plain-text reply. File attachments are not supported.',
      inputSchema: z.object({
        ticket_number: z.number().int().positive(),
        message: z.string(),
      }),
      annotations: annotations.write,
    },
    async ({ ticket_number, message }) =>
      runTool(() =>
        client.request({
          method: 'POST',
          path: `/account/tickets/${ticket_number}/reply`,
          body: { message },
        }),
      ),
  );
}
