import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

export function registerCertificateTools(
  server: McpServer,
  client: MijnHostClient,
): void {
  registerJsonTool(
    server,
    "list-certificates",
    {
      description:
        "List SSL certificates (GET /certificates/). Unrequested packages have requested=false and an empty domain.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        page: z.number().int().positive().optional().describe("Page (1-based)."),
        limit: z.number().int().positive().optional().describe("Page size."),
      }),
    },
    async (input) =>
      client.request({
        path: "/certificates/",
        query: { page: input.page, limit: input.limit },
      }),
  );

  registerJsonTool(
    server,
    "get-certificate",
    {
      description:
        "Get one SSL certificate (GET /certificates/{id}). Poll while validation is pending; download certificate/intermediate_certificate when certificate_status is ACT.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Certificate ID."),
      }),
    },
    async (input) =>
      client.request({ path: `/certificates/${encodePathSegment(input.id)}` }),
  );

  registerJsonTool(
    server,
    "list-certificate-packages",
    {
      description:
        "List SSL packages that can be ordered, with prices and periods (GET /certificates/products).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/certificates/products" }),
  );

  registerJsonTool(
    server,
    "order-certificate",
    {
      description:
        "Buy an SSL certificate package (POST /certificates/order). Executes immediately and charges the account.",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        product_id: z.union([z.string(), z.number()]).describe("Package product_id."),
        duration: z.union([z.string(), z.number()]).describe("Contract period."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/certificates/order",
        body: { product_id: input.product_id, duration: input.duration },
      }),
  );

  registerJsonTool(
    server,
    "generate-csr",
    {
      description:
        "Generate a CSR and matching private key (POST /certificates/csr). Send the csr to request-certificate.",
      inputSchema: z.object({
        common_name: z
          .string()
          .describe("Domain the certificate is for. Use *.example.com for a wildcard."),
        organization: z.string().describe("Organization name."),
        email: z.string().describe("Email address."),
        country: z.string().describe("Two-letter country code."),
        state: z.string().describe("Province or state."),
        locality: z.string().describe("City."),
        unit: z.string().optional().describe("Organizational unit."),
        bits: z.number().int().optional().describe("Key size in bits. Defaults to 2048."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/certificates/csr",
        body: compactBody(input),
      }),
  );

  registerJsonTool(
    server,
    "request-certificate",
    {
      description:
        "Request the actual certificate for a bought package (POST /certificates/{id}/request). Poll get-certificate afterwards. The private key is never returned again.",
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Certificate package ID."),
        profile_id: z
          .number()
          .int()
          .describe("Contact profile ID used as the organization on the certificate."),
        csr: z.string().describe("Certificate signing request in PEM format."),
        validation_method: z
          .enum(["dns", "http", "https", "email"])
          .describe("How the CA validates the domain."),
        approver_email: z.string().describe("Approver email (used when validation_method is email)."),
        private_key: z
          .string()
          .optional()
          .describe("Private key belonging to the CSR. Stored with the certificate."),
        auto_setup_dns: z
          .boolean()
          .optional()
          .describe(
            "Publish the DNS validation record automatically (dns method, mijn.host nameservers only).",
          ),
      }),
    },
    async (input) => {
      const { id, ...body } = input;
      return client.request({
        method: "POST",
        path: `/certificates/${encodePathSegment(id)}/request`,
        body: compactBody(body),
      });
    },
  );
}
