import * as z from 'zod/v4';

export const domainParam = z
  .string()
  .min(1)
  .describe('Domain name including TLD, e.g. example.com');

export const idParam = z.number().int().positive().describe('Numeric resource id');

export const page = z.number().int().min(1).optional().describe('Page number (1-based)');

export const limit = z
  .number()
  .int()
  .min(1)
  .max(100)
  .optional()
  .describe('Page size. Maximum 100.');

export const search = z.string().optional().describe('Optional search filter');

export const paginationQuery = {
  page,
  limit,
  search,
};

export const contactRoleIds = z
  .object({
    owner: z.number().int().optional().describe('Owner contact profile id'),
    admin: z.number().int().optional().describe('Admin contact profile id'),
    tech: z.number().int().optional().describe('Tech contact profile id'),
    billing: z.number().int().optional().describe('Billing contact profile id'),
    reseller: z
      .number()
      .int()
      .optional()
      .describe('Reseller contact profile id. Use 0 on .be to remove the reseller.'),
  })
  .optional();

export const liveDnsRecord = z.object({
  type: z.string().describe('DNS type, e.g. A, AAAA, CNAME, MX, TXT'),
  name: z
    .string()
    .describe('Record name. Prefer FQDN with a trailing dot (example.com.). Apex may be the domain.'),
  value: z
    .string()
    .describe('Record data. For MX include priority in the value, e.g. "10 mail.example.com."'),
  ttl: z.number().int().min(1).max(2147483647).describe('TTL in seconds. Maximum 2147483647.'),
});

export const templateDnsRecord = z.object({
  type: z.string().describe('DNS record type'),
  name: z.string().optional().describe('Record name. Empty string is apex in templates.'),
  value: z.string().describe('Record data'),
  ttl: z.number().int().optional().describe('TTL in seconds'),
  priority: z.number().int().optional().describe('MX priority (templates only; live DNS embeds this in value)'),
});

export const nameserverHost = z.object({
  hostname: z
    .string()
    .describe('Nameserver hostname. Do not use nsX.mijn.host or nsX.webhost.company.'),
  ipv4: z.string().describe('IPv4 glue address (required when creating a profile)'),
  ipv6: z.string().optional().describe('Optional IPv6 glue address'),
});

export const contactDefaults = z.object({
  owner: z.boolean().optional(),
  admin: z.boolean().optional(),
  tech: z.boolean().optional(),
  billing: z.boolean().optional(),
  reseller: z.boolean().optional(),
});

export const contactProfileCreate = z.object({
  company_name: z.string().optional().describe('Company name'),
  vat: z.string().optional().describe('VAT number'),
  firstname: z.string().describe('First name'),
  lastname: z.string().describe('Last name'),
  street: z.string().describe('Street'),
  street_number: z.string().describe('Street number'),
  street_suffix: z.string().optional().describe('Street number suffix'),
  zipcode: z.string().describe('Postal code'),
  city: z.string().describe('City'),
  state: z.string().optional().describe('State / province'),
  country: z.string().describe('ISO country code, e.g. NL'),
  email: z.string().describe('Email address'),
  phone_country: z.string().describe('Phone country code, e.g. +31'),
  phone_area: z.string().describe('Phone area code, e.g. 6'),
  phone_number: z.string().describe('National number without country/area prefix'),
  social_security_number: z.string().optional().describe('BSN / social security number'),
  passport_number: z.string().optional(),
  company_registration_number: z.string().optional().describe('KVK / company registration number'),
  company_url: z.string().optional(),
  birth_date: z.string().optional().describe('Birth date YYYY-MM-DD'),
  defaults: contactDefaults.describe('Default roles when no profile is given on a domain order'),
});

export const contactProfileUpdate = z
  .object({
    vat: z.string().optional(),
    street: z.string().optional(),
    street_number: z.string().optional(),
    street_suffix: z.string().optional(),
    zipcode: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    email: z.string().optional(),
    phone_country: z.string().optional(),
    phone_area: z.string().optional(),
    phone_number: z.string().optional(),
    social_security_number: z.string().optional(),
    passport_number: z.string().optional(),
    company_registration_number: z.string().optional(),
    company_url: z.string().optional(),
    birth_date: z.string().optional(),
    defaults: contactDefaults.optional(),
  })
  .optional();

export const userPermissions = z
  .object({
    domains: z.boolean().optional(),
    'domains-profiles': z.boolean().optional(),
    'domains-nameservers': z.boolean().optional(),
    'domains-dns-templates': z.boolean().optional(),
    hosting: z.boolean().optional(),
    'public-cloud': z.boolean().optional(),
    vps: z.boolean().optional(),
    'dedicated-servers': z.boolean().optional(),
    'microsoft-365': z.boolean().optional(),
    certificates: z.boolean().optional(),
    account: z.boolean().optional(),
    'account-profile': z.boolean().optional(),
    'account-paymethods': z.boolean().optional(),
    'account-invoices': z.boolean().optional(),
    'account-api': z.boolean().optional(),
    'account-users': z.boolean().optional(),
    'account-tickets': z.boolean().optional(),
    'account-affiliate': z.boolean().optional(),
    'reseller-settings': z.boolean().optional(),
    'reseller-whitelabel-management': z.boolean().optional(),
    'reseller-email-templates': z.boolean().optional(),
    order: z.boolean().optional(),
  })
  .optional();
