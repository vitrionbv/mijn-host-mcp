import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { normalizeLiveDnsRecord } from '../dns.js';
import { annotations, runTool } from '../result.js';
import { domainParam, liveDnsRecord } from '../schemas.js';

export function registerDnsTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'get-dns-records',
    {
      title: 'Get DNS records',
      description:
        'List live DNS records for a domain (type, name, value, ttl). Requires managed_dns. Prefer this plus update-dns-record / delete-dns-record instead of replacing the whole zone.',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.readOnly,
    },
    async ({ domain }) =>
      runTool(() =>
        client.request({ method: 'GET', path: `/domains/${encodeURIComponent(domain)}/dns` }),
      ),
  );

  server.registerTool(
    'replace-dns-records',
    {
      title: 'Replace all DNS records',
      description:
        'DESTRUCTIVE: replaces the entire zone with the records you send. Missing records are deleted. Prefer update-dns-record for a single change. MX value must be "priority target." (e.g. "10 mail.example.com."). Names should be FQDNs with a trailing dot. Not available when DNS is not managed by mijn.host.',
      inputSchema: z.object({
        domain: domainParam,
        records: z.array(liveDnsRecord).min(1).describe('Complete desired record set'),
      }),
      annotations: annotations.destructive,
    },
    async ({ domain, records }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/domains/${encodeURIComponent(domain)}/dns`,
          body: { records: records.map(normalizeLiveDnsRecord) },
        }),
      ),
  );

  server.registerTool(
    'update-dns-record',
    {
      title: 'Update one DNS record',
      description:
        'Create or update a single DNS record (PATCH). Safe default for one-record changes. MX value format: "10 mail.example.com.". Names are normalized to FQDN with a trailing dot.',
      inputSchema: z.object({
        domain: domainParam,
        record: liveDnsRecord,
      }),
      annotations: annotations.write,
    },
    async ({ domain, record }) =>
      runTool(() =>
        client.request({
          method: 'PATCH',
          path: `/domains/${encodeURIComponent(domain)}/dns`,
          body: { record: normalizeLiveDnsRecord(record) },
        }),
      ),
  );

  server.registerTool(
    'delete-dns-record',
    {
      title: 'Delete one DNS record',
      description:
        'Delete one record identified by type + name + value. If that is the only value in the rrset, the rrset is removed; otherwise other values are kept.',
      inputSchema: z.object({
        domain: domainParam,
        record: z.object({
          type: z.string(),
          name: z.string(),
          value: z.string(),
        }),
      }),
      annotations: annotations.destructive,
    },
    async ({ domain, record }) =>
      runTool(() =>
        client.request({
          method: 'DELETE',
          path: `/domains/${encodeURIComponent(domain)}/dns`,
          body: { record: normalizeLiveDnsRecord(record) },
        }),
      ),
  );

  server.registerTool(
    'get-dns-zone',
    {
      title: 'Export DNS zonefile',
      description:
        'Return the zone as a BIND zonefile string (data.zone). Not available for Cloudflare-managed DNS.',
      inputSchema: z.object({ domain: domainParam }),
      annotations: annotations.readOnly,
    },
    async ({ domain }) =>
      runTool(() =>
        client.request({
          method: 'GET',
          path: `/domains/${encodeURIComponent(domain)}/dns/zone`,
        }),
      ),
  );

  server.registerTool(
    'import-dns-zone',
    {
      title: 'Import DNS zonefile',
      description:
        'DESTRUCTIVE: replace all records from a BIND zonefile. Send the raw zone text (newlines allowed); this tool JSON-encodes it once. Lines are name ttl IN type rdata. SOA and apex NS in the file are ignored. On rejection the previous zone is restored. Not available for Cloudflare-managed DNS.',
      inputSchema: z.object({
        domain: domainParam,
        zone: z.string().describe('BIND zonefile text'),
      }),
      annotations: annotations.destructive,
    },
    async ({ domain, zone }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/domains/${encodeURIComponent(domain)}/dns/zone`,
          body: { zone },
        }),
      ),
  );
}
