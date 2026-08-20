import type { McpServer } from '@modelcontextprotocol/server';
import type { MijnHostClient } from '../client.js';
import { registerAccountTools } from './account.js';
import { registerAffiliateTools } from './affiliate.js';
import { registerCertificateTools } from './certificates.js';
import { registerContactTools } from './contacts.js';
import { registerDnsTools } from './dns.js';
import { registerDomainTools } from './domains.js';
import { registerExtensionTools } from './extensions.js';
import { registerNameserverTools } from './nameservers.js';
import { registerOrderTools } from './orders.js';
import { registerTemplateTools } from './templates.js';
import { registerVpsTools } from './vps.js';
import { registerWhoamiTools } from './whoami.js';

export const TOOL_NAMES = [
  'whoami',
  'list-domains',
  'get-domain',
  'update-domain',
  'cancel-domain',
  'get-domain-auth-code',
  'cancel-domain-deletion',
  'check-domain-availability',
  'order-domain',
  'list-domain-extensions',
  'get-domain-extension',
  'list-contact-profiles',
  'create-contact-profile',
  'get-contact-profile',
  'update-contact-profile',
  'delete-contact-profile',
  'list-nameserver-profiles',
  'create-nameserver-profile',
  'get-nameserver-profile',
  'update-nameserver-profile',
  'delete-nameserver-profile',
  'list-dns-templates',
  'create-dns-template',
  'get-dns-template',
  'update-dns-template',
  'delete-dns-template',
  'get-dns-records',
  'replace-dns-records',
  'update-dns-record',
  'delete-dns-record',
  'get-dns-zone',
  'import-dns-zone',
  'list-orders',
  'get-order',
  'update-order',
  'list-vps',
  'list-vps-images',
  'get-vps',
  'update-vps',
  'cancel-vps',
  'cancel-vps-deletion',
  'change-vps-hostname',
  'poweroff-vps',
  'reinstall-vps',
  'set-vps-rescue-mode',
  'reset-vps-password',
  'restart-vps',
  'start-vps',
  'stop-vps',
  'list-vps-backups',
  'create-vps-backup',
  'restore-vps-backup',
  'list-certificates',
  'generate-csr',
  'order-certificate',
  'list-certificate-products',
  'get-certificate',
  'request-certificate',
  'get-account-profile',
  'update-account-profile',
  'list-payment-methods',
  'update-default-payment-method',
  'list-invoices',
  'get-invoice',
  'download-invoice-pdf',
  'list-account-users',
  'create-account-user',
  'get-account-user',
  'update-account-user',
  'list-tickets',
  'create-ticket',
  'get-ticket',
  'reply-to-ticket',
  'list-affiliate-commissions',
  'get-affiliate-commission',
  'list-affiliate-payments',
  'get-affiliate-payment',
] as const;

export function registerAllTools(server: McpServer, client: MijnHostClient): void {
  registerWhoamiTools(server, client);
  registerDomainTools(server, client);
  registerDnsTools(server, client);
  registerOrderTools(server, client);
  registerExtensionTools(server, client);
  registerContactTools(server, client);
  registerNameserverTools(server, client);
  registerTemplateTools(server, client);
  registerVpsTools(server, client);
  registerCertificateTools(server, client);
  registerAccountTools(server, client);
  registerAffiliateTools(server, client);
}
