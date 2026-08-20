import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const defaultsSchema = z
  .object({
    owner: z.boolean().optional(),
    admin: z.boolean().optional(),
    tech: z.boolean().optional(),
    billing: z.boolean().optional(),
    reseller: z.boolean().optional(),
  })
  .describe("Which handle roles this profile is the default for.");

const createProfileFields = z.object({
  company_name: z.string().optional().describe("Company name."),
  vat: z.string().optional().describe("Company VAT number."),
  firstname: z.string().describe("First name."),
  lastname: z.string().describe("Last name."),
  street: z.string().describe("Street."),
  street_number: z.string().describe("Street number."),
  street_suffix: z.string().optional().describe("Street number suffix."),
  zipcode: z.string().describe("Zip code."),
  city: z.string().describe("City."),
  state: z.string().optional().describe("State."),
  country: z.string().describe("Country code (e.g. NL)."),
  email: z.string().describe("Email address."),
  phone_country: z.string().describe("Phone country code (e.g. +31)."),
  phone_area: z.string().describe("Phone area code (e.g. 6)."),
  phone_number: z.string().describe("Phone number without country/area code."),
  defaults: defaultsSchema,
  social_security_number: z
    .string()
    .optional()
    .describe("Social security number (Burgerservicenummer)."),
  passport_number: z.string().optional().describe("Passport number."),
  company_registration_number: z
    .string()
    .optional()
    .describe("Company registration number (KVK-nummer)."),
  company_url: z.string().optional().describe("Company website URL."),
  birth_date: z.string().optional().describe("Birth date (YYYY-MM-DD)."),
});

const updateProfileFields = z.object({
  vat: z.string().optional().describe("Company VAT number."),
  street: z.string().optional().describe("Street."),
  street_number: z.string().optional().describe("Street number."),
  street_suffix: z.string().optional().describe("Street number suffix."),
  zipcode: z.string().optional().describe("Zip code."),
  city: z.string().optional().describe("City."),
  state: z.string().optional().describe("State."),
  country: z.string().optional().describe("Country code (e.g. NL)."),
  email: z.string().optional().describe("Email address."),
  phone_country: z.string().optional().describe("Phone country code (e.g. +31)."),
  phone_area: z.string().optional().describe("Phone area code."),
  phone_number: z.string().optional().describe("Phone number without country/area code."),
  defaults: defaultsSchema.optional(),
  social_security_number: z.string().optional(),
  passport_number: z.string().optional(),
  company_registration_number: z.string().optional(),
  company_url: z.string().optional(),
  birth_date: z.string().optional(),
});

export function registerContactTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "list-contact-profiles",
    {
      description:
        "List WHOIS/contact handle profiles (GET /domains/contacts).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/domains/contacts" }),
  );

  registerJsonTool(
    server,
    "get-contact-profile",
    {
      description: "Get a contact handle profile (GET /domains/contacts/{id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Contact profile ID."),
      }),
    },
    async (input) =>
      client.request({ path: `/domains/contacts/${encodePathSegment(input.id)}` }),
  );

  registerJsonTool(
    server,
    "create-contact-profile",
    {
      description: "Create a contact handle profile (POST /domains/contacts).",
      inputSchema: z.object({
        name: z.string().describe("Profile name."),
        profile: createProfileFields.describe("Contact profile data."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: "/domains/contacts",
        body: { name: input.name, profile: input.profile },
      }),
  );

  registerJsonTool(
    server,
    "update-contact-profile",
    {
      description:
        "Update a contact handle profile (PUT /domains/contacts/{id}). Optional fields left empty are not updated.",
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Contact profile ID."),
        name: z.string().optional().describe("Profile name."),
        profile: updateProfileFields.optional().describe("Fields to update."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/domains/contacts/${encodePathSegment(input.id)}`,
        body: compactBody({ name: input.name, profile: input.profile }) ?? {},
      }),
  );

  registerJsonTool(
    server,
    "delete-contact-profile",
    {
      description: "Delete a contact handle profile (DELETE /domains/contacts/{id}).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        id: z.union([z.string(), z.number()]).describe("Contact profile ID."),
      }),
    },
    async (input) =>
      client.request({
        method: "DELETE",
        path: `/domains/contacts/${encodePathSegment(input.id)}`,
      }),
  );
}
