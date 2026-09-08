# mijn-host-mcp

[![npm version](https://img.shields.io/npm/v/@vitrion/mijn-host-mcp.svg)](https://www.npmjs.com/package/@vitrion/mijn-host-mcp)
[![npm downloads](https://img.shields.io/npm/dm/@vitrion/mijn-host-mcp.svg)](https://www.npmjs.com/package/@vitrion/mijn-host-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple.svg)](https://modelcontextprotocol.io/)

**mijn.host MCP server** — full [mijn.host API v2](https://mijn.host/api/doc/) coverage for AI assistants via the [Model Context Protocol](https://modelcontextprotocol.io/).

Published as [`@vitrion/mijn-host-mcp`](https://www.npmjs.com/package/@vitrion/mijn-host-mcp).

This server uses the **official API v2 endpoints** (`https://mijn.host/api/v2`). Paths and request bodies are taken from the [published documentation](https://mijn.host/api/doc/doc-343215); they are not invented.

## Features

- **78 tools** for every released v2 operation: domains, DNS, orders, contacts (handles), nameservers, DNS templates, TLDs, VPS, certificates, affiliate, and account
- Domain lock, URL forwarder, DNSSEC, and tags via `update-domain`
- Register / transfer orders with premium-price confirmation
- Automatic rate-limit retry (429 + `Retry-After`)
- Logs only to stderr (stdio-safe)

## Requirements

- Node.js **>= 20**
- A [mijn.host API key](https://mijn.host/cp/) (create a ticket from API Access if you do not have one yet)

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MIJN_HOST_API_KEY` | Yes | API key sent as the `API-Key` header |
| `MIJNHOST_API_KEY` | No | Silent alias for `MIJN_HOST_API_KEY` |

The client also sends `Accept: application/json`, `Content-Type: application/json`, and `User-Agent: @vitrion/mijn-host-mcp/<version>`. The API key is never written to logs.

## Install

```bash
npx -y @vitrion/mijn-host-mcp
```

### Cursor

Add to your user config (`~/.cursor/mcp.json`) or project config (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "mijn-host-mcp": {
      "command": "npx",
      "args": ["-y", "@vitrion/mijn-host-mcp"],
      "env": {
        "MIJN_HOST_API_KEY": "your-mijn-host-api-key"
      }
    }
  }
}
```

You can also add the server from **Cursor Settings → Tools & MCP**.

### Claude Desktop

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "mijn-host-mcp": {
      "command": "npx",
      "args": ["-y", "@vitrion/mijn-host-mcp"],
      "env": {
        "MIJN_HOST_API_KEY": "your-mijn-host-api-key"
      }
    }
  }
}
```

### Claude Code

```bash
claude mcp add mijn-host-mcp -- npx -y @vitrion/mijn-host-mcp
```

Set `MIJN_HOST_API_KEY` in your shell environment or MCP host config.

## Tool groups

Tools are named in kebab-case and map one-to-one to mijn.host API v2 operations:

| Group | Examples |
|-------|----------|
| **Domains** | `list-domains`, `get-domain`, `update-domain` (lock / forwarder / DNSSEC / tags / handles), `cancel-domain`, `cancel-domain-deletion`, `get-auth-code`, `check-domain-availability` |
| **DNS** | `list-dns-records`, `replace-dns-records`, `update-dns-record`, `delete-dns-record`, `get-dns-zonefile`, `import-dns-zonefile` |
| **Contacts (handles)** | `list-contact-profiles`, `get-contact-profile`, `create-contact-profile`, `update-contact-profile`, `delete-contact-profile` |
| **Nameservers** | `list-nameserver-profiles`, `get-nameserver-profile`, `create-nameserver-profile`, `update-nameserver-profile`, `delete-nameserver-profile` |
| **DNS templates** | `list-dns-templates`, `get-dns-template`, `create-dns-template`, `update-dns-template`, `delete-dns-template` |
| **Orders** | `create-order` (register/transfer), `list-orders`, `get-order`, `update-order` |
| **Extensions** | `list-domain-extensions`, `get-domain-extension` (register / renew / transfer prices) |
| **VPS** | list/get/update, start/stop/poweroff/restart, rescue, backups, reinstall, cancel |
| **Certificates** | list/get, packages, `order-certificate`, `generate-csr`, `request-certificate` |
| **Affiliate** | commissions and payments |
| **Account** | profile, payment methods, invoices (including PDF), users, support tickets |
| **Tools** | `get-whoami` (public IP + customer number) |

There is no standalone “renew domain” path in the published v2 docs. Renewals are managed through domain status, `cancel-domain` (cancel before the renewal date), and `cancel-domain-deletion`.

`create-order` and `order-certificate` charge the account immediately. For premium domains, call `check-domain-availability` first and pass `accept_premium_price` matching `data.premium_price`.

## For AI agents / Cursor

- Base URL is always `https://mijn.host/api/v2`. Do not invent paths; use the kebab-case tools.
- Authenticate with `MIJN_HOST_API_KEY` (or `MIJNHOST_API_KEY`). Never echo or log the key.
- Prefer `list-domains` / `get-domain` before mutating DNS, lock, forwarder, DNSSEC, or tags.
- `replace-dns-records` and `import-dns-zonefile` replace the **entire** zone. Use `update-dns-record` / `delete-dns-record` for single changes.
- Confirm premium pricing with `check-domain-availability` before `create-order`.
- Example MCP config uses `npx -y @vitrion/mijn-host-mcp` and a placeholder `MIJN_HOST_API_KEY`.

## Development

```bash
git clone https://github.com/vitrionbv/mijn-host-mcp.git
cd mijn-host-mcp
npm install
npm run build
npm test
npm run dev
```

## Inspector

Debug the MCP server with the official inspector (requires a built `dist/`):

```bash
npm run build
npm run inspector
```

Or directly:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Publishing

Releases go to [npm](https://www.npmjs.com/package/@vitrion/mijn-host-mcp) with [trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). Push a `v*` tag to run [`.github/workflows/npm-publish.yml`](.github/workflows/npm-publish.yml). The workflow uses `id-token: write` and does **not** use `NODE_AUTH_TOKEN`.

The trusted publisher is already configured: GitHub repo `vitrionbv/mijn-host-mcp`, workflow `npm-publish.yml`.

## License

MIT — see [LICENSE](LICENSE).

## Links

- [npm: @vitrion/mijn-host-mcp](https://www.npmjs.com/package/@vitrion/mijn-host-mcp)
- [GitHub: vitrionbv/mijn-host-mcp](https://github.com/vitrionbv/mijn-host-mcp)
- [Issues](https://github.com/vitrionbv/mijn-host-mcp/issues)
- [mijn.host API v2 docs](https://mijn.host/api/doc/)
- [mijn.host control panel](https://mijn.host/cp/)
