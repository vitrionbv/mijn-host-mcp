import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "./create-server.js";
import { PACKAGE_NAME, PACKAGE_VERSION } from "./version.js";

const EXPECTED_TOOLS = [
  "get-whoami",
  "list-domains",
  "get-domain",
  "update-domain",
  "cancel-domain",
  "cancel-domain-deletion",
  "get-auth-code",
  "check-domain-availability",
  "list-dns-records",
  "replace-dns-records",
  "update-dns-record",
  "delete-dns-record",
  "get-dns-zonefile",
  "import-dns-zonefile",
  "list-contact-profiles",
  "get-contact-profile",
  "create-contact-profile",
  "update-contact-profile",
  "delete-contact-profile",
  "list-nameserver-profiles",
  "get-nameserver-profile",
  "create-nameserver-profile",
  "update-nameserver-profile",
  "delete-nameserver-profile",
  "list-dns-templates",
  "get-dns-template",
  "create-dns-template",
  "update-dns-template",
  "delete-dns-template",
  "list-domain-extensions",
  "get-domain-extension",
  "create-order",
  "list-orders",
  "get-order",
  "update-order",
  "list-vps",
  "get-vps",
  "update-vps",
  "start-vps",
  "stop-vps",
  "poweroff-vps",
  "restart-vps",
  "reset-vps-password",
  "change-vps-hostname",
  "cancel-vps",
  "cancel-vps-deletion",
  "update-vps-rescue",
  "list-vps-images",
  "reinstall-vps",
  "list-vps-backups",
  "create-vps-backup",
  "restore-vps-backup",
  "list-certificates",
  "get-certificate",
  "list-certificate-packages",
  "order-certificate",
  "generate-csr",
  "request-certificate",
  "list-affiliate-commissions",
  "get-affiliate-commission",
  "list-affiliate-payments",
  "get-affiliate-payment",
  "get-account-profile",
  "update-account-profile",
  "list-payment-methods",
  "update-default-payment-method",
  "list-invoices",
  "get-invoice",
  "download-invoice-pdf",
  "list-account-users",
  "get-account-user",
  "create-account-user",
  "update-account-user",
  "list-support-tickets",
  "get-support-ticket",
  "create-support-ticket",
  "reply-to-support-ticket",
];

describe("createServer", () => {
  beforeEach(() => {
    process.env.MIJN_HOST_API_KEY = "test-key";
  });

  afterEach(() => {
    delete process.env.MIJN_HOST_API_KEY;
  });

  it("creates a server with the package identity", () => {
    const server = createServer();
    expect(server).toBeTruthy();
    const info = (
      server as unknown as { serverInfo?: { name: string; version: string } }
    ).serverInfo;
    if (info) {
      expect(info.name).toBe(PACKAGE_NAME);
      expect(info.version).toBe(PACKAGE_VERSION);
    }
  });

  it("registers kebab-case tools for released v2 endpoints", () => {
    const server = createServer();
    const tools = listRegisteredToolNames(server);
    expect(tools.sort()).toEqual([...EXPECTED_TOOLS].sort());
    for (const name of tools) {
      expect(name).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

function listRegisteredToolNames(server: unknown): string[] {
  const candidate = server as {
    _registeredTools?: Record<string, unknown>;
    _tools?: Record<string, unknown>;
    tools?: Map<string, unknown> | Record<string, unknown>;
  };

  if (candidate._registeredTools) {
    return Object.keys(candidate._registeredTools);
  }
  if (candidate._tools) {
    return Object.keys(candidate._tools);
  }
  if (candidate.tools instanceof Map) {
    return [...candidate.tools.keys()];
  }
  if (candidate.tools && typeof candidate.tools === "object") {
    return Object.keys(candidate.tools);
  }

  throw new Error("Unable to inspect registered MCP tools");
}
