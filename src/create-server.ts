import { McpServer } from "@modelcontextprotocol/server";
import { MijnHostClient } from "./mijn-host/client.js";
import { registerAccountTools } from "./tools/account.js";
import { registerAffiliateTools } from "./tools/affiliate.js";
import { registerCertificateTools } from "./tools/certificates.js";
import { registerContactTools } from "./tools/contacts.js";
import { registerDnsTools } from "./tools/dns.js";
import { registerDnsTemplateTools } from "./tools/dns-templates.js";
import { registerDomainTools } from "./tools/domains.js";
import { registerExtensionTools } from "./tools/extensions.js";
import { registerNameserverTools } from "./tools/nameservers.js";
import { registerOrderTools } from "./tools/orders.js";
import { registerVpsTools } from "./tools/vps.js";
import { registerWhoamiTools } from "./tools/whoami.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./version.js";

export function createServer(): McpServer {
  const server = new McpServer({
    name: PACKAGE_NAME,
    version: PACKAGE_VERSION,
  });

  const client = new MijnHostClient();

  registerWhoamiTools(server, client);
  registerDomainTools(server, client);
  registerDnsTools(server, client);
  registerContactTools(server, client);
  registerNameserverTools(server, client);
  registerDnsTemplateTools(server, client);
  registerExtensionTools(server, client);
  registerOrderTools(server, client);
  registerVpsTools(server, client);
  registerCertificateTools(server, client);
  registerAffiliateTools(server, client);
  registerAccountTools(server, client);

  return server;
}
