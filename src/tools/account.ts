import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const pageQuery = {
  page: z.number().int().positive().optional().describe("Page (1-based)."),
  limit: z.number().int().positive().optional().describe("Page size."),
  search: z.string().optional().describe("Optional search string."),
};

const permissionsSchema = z
  .record(z.string(), z.boolean())
  .optional()
  .describe(
    "Optional permission flags (domains, vps, account, order, …). Every key is optional.",
  );

export function registerAccountTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "get-account-profile",
    {
      description:
        "Get the account profile (GET /account/profile/). company and account_type are read-only.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/account/profile/" }),
  );

  registerJsonTool(
    server,
    "update-account-profile",
    {
      description:
        "Replace the account profile (PUT /account/profile/). Omitted keys are cleared except email_invoices and company_vat_number. Changing email sends a verification message.",
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
          .describe(
            "Required. National format with phone_country_code, or a full international number.",
          ),
        phone_country_code: z
          .string()
          .optional()
          .describe("International dialing code as digits (e.g. 31)."),
        email: z.string().describe("Account email. Changing it triggers verification."),
        email_invoices: z.string().optional().describe("Optional invoice email."),
        company_vat_number: z
          .string()
          .nullable()
          .optional()
          .describe("Optional; omit or null to clear."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: "/account/profile/",
        body: compactBody(input),
      }),
  );

  registerJsonTool(
    server,
    "list-payment-methods",
    {
      description: "List payment methods (GET /account/paymethods/).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/account/paymethods/" }),
  );

  registerJsonTool(
    server,
    "update-default-payment-method",
    {
      description:
        "Set the default payment method (PUT /account/paymethods/). Use default_paymethod_id from list-payment-methods, or paymethod=bank_transfer.",
      inputSchema: z.object({
        default_paymethod_id: z
          .string()
          .optional()
          .describe("Provider method id. Ignored when paymethod is bank_transfer."),
        paymethod: z
          .literal("bank_transfer")
          .optional()
          .describe("Set bank transfer as the default."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: "/account/paymethods/",
        body: compactBody(input) ?? {},
      }),
  );

  registerJsonTool(
    server,
    "list-invoices",
    {
      description: "List invoices (GET /account/invoices/).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object(pageQuery),
    },
    async (input) =>
      client.request({
        path: "/account/invoices/",
        query: input,
      }),
  );

  registerJsonTool(
    server,
    "get-invoice",
    {
      description: "Get invoice details (GET /account/invoices/{invoice_nr}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        invoice_nr: z.union([z.string(), z.number()]).describe("Display invoice number."),
      }),
    },
    async (input) =>
      client.request({
        path: `/account/invoices/${encodePathSegment(input.invoice_nr)}`,
      }),
  );

  registerJsonTool(
    server,
    "download-invoice-pdf",
    {
      description:
        "Download an invoice PDF as base64 (GET /account/invoices/{invoice_nr}/pdf).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        invoice_nr: z.union([z.string(), z.number()]).describe("Display invoice number."),
      }),
    },
    async (input) =>
      client.request({
        path: `/account/invoices/${encodePathSegment(input.invoice_nr)}/pdf`,
        accept: "application/pdf",
      }),
  );

  registerJsonTool(
    server,
    "list-account-users",
    {
      description: "List sub-users on the account (GET /account/users/).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object(pageQuery),
    },
    async (input) =>
      client.request({
        path: "/account/users/",
        query: input,
      }),
  );

  registerJsonTool(
    server,
    "get-account-user",
    {
      description: "Get one sub-user and their permissions (GET /account/users/{id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("User ID."),
      }),
    },
    async (input) =>
      client.request({ path: `/account/users/${encodePathSegment(input.id)}` }),
  );

  registerJsonTool(
    server,
    "create-account-user",
    {
      description:
        "Create a sub-user (POST /account/users/). Limited to 10 new users per account per hour.",
      inputSchema: z.object({
        email: z.string().describe("Sign-in email; must be unique among active customers."),
        firstname: z.string(),
        lastname: z.string(),
        password: z.string(),
        password_confirm: z
          .string()
          .optional()
          .describe("Defaults to password when omitted."),
        permissions: permissionsSchema,
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/account/users/",
        body: compactBody(input),
      }),
  );

  registerJsonTool(
    server,
    "update-account-user",
    {
      description:
        "Update a sub-user (PUT /account/users/{id}). For non-primary users, permissions replaces the full set when sent.",
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("User ID."),
        firstname: z.string().optional(),
        lastname: z.string().optional(),
        permissions: permissionsSchema,
      }),
    },
    async (input) => {
      const { id, ...body } = input;
      return client.request({
        method: "PUT",
        path: `/account/users/${encodePathSegment(id)}`,
        body: compactBody(body) ?? {},
      });
    },
  );

  registerJsonTool(
    server,
    "list-support-tickets",
    {
      description:
        "List support tickets (GET /account/tickets/). search matches subject or ticket_number.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object(pageQuery),
    },
    async (input) =>
      client.request({
        path: "/account/tickets/",
        query: input,
      }),
  );

  registerJsonTool(
    server,
    "get-support-ticket",
    {
      description:
        "Get a support ticket thread (GET /account/tickets/{ticket_number}). Message bodies are HTML.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        ticket_number: z.union([z.string(), z.number()]).describe("Ticket number."),
      }),
    },
    async (input) =>
      client.request({
        path: `/account/tickets/${encodePathSegment(input.ticket_number)}`,
      }),
  );

  registerJsonTool(
    server,
    "create-support-ticket",
    {
      description: "Create a support ticket (POST /account/tickets/).",
      inputSchema: z.object({
        subject: z.string(),
        message: z.string().describe("Plain text or HTML."),
        department: z
          .enum(["support", "administration", "sales", "public_cloud", "microsoft_365"])
          .describe("Ticket department."),
        product_type: z.string().optional(),
        product_name: z.string().optional(),
        product_link: z.string().optional(),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/account/tickets/",
        body: compactBody(input),
      }),
  );

  registerJsonTool(
    server,
    "reply-to-support-ticket",
    {
      description:
        "Reply to a support ticket (POST /account/tickets/{ticket_number}/reply). File attachments are not supported.",
      inputSchema: z.object({
        ticket_number: z.union([z.string(), z.number()]).describe("Ticket number."),
        message: z.string().describe("Reply body."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/account/tickets/${encodePathSegment(input.ticket_number)}/reply`,
        body: { message: input.message },
      }),
  );
}
