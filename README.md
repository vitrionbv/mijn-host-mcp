# @vitrion/mijn-host-mcp

[![npm version](https://img.shields.io/npm/v/@vitrion/mijn-host-mcp.svg?logo=npm)](https://www.npmjs.com/package/@vitrion/mijn-host-mcp)
[![CI](https://img.shields.io/github/actions/workflow/status/vitrionbv/mijn-host-mcp/ci.yml?branch=main&label=CI)](https://github.com/vitrionbv/mijn-host-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@vitrion/mijn-host-mcp.svg?logo=node.js)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-TypeScript%20SDK%20v2-412991.svg)](https://modelcontextprotocol.io)
[![npm provenance](https://img.shields.io/badge/provenance-trusted%20publishing-0A7A3E.svg)](https://docs.npmjs.com/trusted-publishers)

Model Context Protocol server for the [mijn.host API v2](https://mijn.host/api/doc/doc-343215). Agents in **Cursor**, Claude Desktop, Claude Code, and VS Code can manage domains, DNS, contacts, nameservers, orders, VPS, SSL certificates, account, tickets, and affiliate data.

Built the official 2026 way: [`@modelcontextprotocol/server`](https://ts.sdk.modelcontextprotocol.io/v2/) v2, Zod 4, `createServer()` + `serveStdio`, ESM, Node 20+.

## Features

- **77 tools** covering every unique v2 endpoint (domains, DNS + BIND zone import/export, contacts, nameserver profiles, DNS templates, orders, extensions, VPS lifecycle/backups, certificates, account, tickets, affiliate)
- Auth via `MIJN_HOST_API_KEY` (`API-Key` header)
- Agent-oriented descriptions, Zod `.describe()` on fields, and MCP annotations (`readOnlyHint`, `destructiveHint`, …)
- Safe DNS defaults: patch/delete one record; full-zone replace is explicitly destructive
- Envelope errors with recovery hints (whitelist, expired key, unmanaged DNS, 429)
- Invoice PDF download as base64 JSON

## Install

Node.js 20 or later.

```bash
npm install -g @vitrion/mijn-host-mcp
```

Or run on demand with `npx` (recommended in host configs below).

## Authentication

1. Sign in at [mijn.host control panel](https://mijn.host/cp/) and create an **API Access** key.
2. Set `MIJN_HOST_API_KEY` in the MCP host env (never commit the key).
3. Optional: restrict the key to IPs. If you get a whitelist 401, call `whoami` and allowlist that outbound IP.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MIJN_HOST_API_KEY` | yes | — | API key sent as `API-Key` |
| `MIJN_HOST_BASE_URL` | no | `https://mijn.host/api/v2` | Override API root |

## Cursor

Project: `.cursor/mcp.json` — user: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "mijn-host": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vitrion/mijn-host-mcp"],
      "env": {
        "MIJN_HOST_API_KEY": "${env:MIJN_HOST_API_KEY}"
      }
    }
  }
}
```

Windows: `"command": "cmd", "args": ["/c", "npx", "-y", "@vitrion/mijn-host-mcp"]`.

Reload MCP servers after saving. Debug in **Output → MCP Logs**.

### For agents (Cursor / Claude)

See [AGENTS.md](./AGENTS.md). Short version:

- Prefer `update-dns-record` over `replace-dns-records` (full zone wipe).
- Live MX `value` is `"10 mail.example.com."`; templates have a separate `priority`.
- `order-domain` and `order-certificate` **charge immediately** — confirm first.
- `check-domain-availability` before register/transfer; premium names need `accept_premium_price`.
- `whoami` on whitelist/auth errors.

## Claude Desktop

`claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/`):

```json
{
  "mcpServers": {
    "mijn-host": {
      "command": "npx",
      "args": ["-y", "@vitrion/mijn-host-mcp"],
      "env": {
        "MIJN_HOST_API_KEY": "your-api-key"
      }
    }
  }
}
```

## VS Code

`.vscode/mcp.json`:

```json
{
  "servers": {
    "mijn-host": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@vitrion/mijn-host-mcp"],
      "env": {
        "MIJN_HOST_API_KEY": "${env:MIJN_HOST_API_KEY}"
      }
    }
  }
}
```

## Claude Code

```bash
claude mcp add mijn-host --env MIJN_HOST_API_KEY=your-api-key -- npx -y @vitrion/mijn-host-mcp
```

## Tool catalog

### Account / session

| Tool | API | Notes |
|---|---|---|
| `whoami` | `GET /whoami` | Outbound IP + customer number |
| `get-account-profile` / `update-account-profile` | `/account/profile/` | Update replaces omitted fields |
| `list-payment-methods` / `update-default-payment-method` | `/account/paymethods/` | |
| `list-invoices` / `get-invoice` / `download-invoice-pdf` | `/account/invoices/` | PDF → base64 |
| `list-account-users` / `create-account-user` / `get-account-user` / `update-account-user` | `/account/users/` | 10 creates/hour |
| `list-tickets` / `create-ticket` / `get-ticket` / `reply-to-ticket` | `/account/tickets/` | |

### Domains & DNS

| Tool | API | Notes |
|---|---|---|
| `list-domains` / `get-domain` / `update-domain` | `/domains` | Tags, lock, DNSSEC, NS, forwarder |
| `cancel-domain` / `cancel-domain-deletion` | `DELETE` / `PUT …/cancel-delete` | Stops / resumes renewal |
| `get-domain-auth-code` | `…/auth-code` | Outbound transfer |
| `check-domain-availability` | `…/availability/{domain}` | Rate-limited; premium prices |
| `order-domain` | `POST /domains/order` | **Bills immediately** |
| `list-orders` / `get-order` / `update-order` | `/orders/` | Retry failed carts |
| `list-domain-extensions` / `get-domain-extension` | `/domains/extensions/` | Paginated |
| `get-dns-records` | `GET …/dns` | |
| `update-dns-record` | `PATCH …/dns` | Preferred single-record write |
| `delete-dns-record` | `DELETE …/dns` | Match type+name+value |
| `replace-dns-records` | `PUT …/dns` | **Replaces entire zone** |
| `get-dns-zone` / `import-dns-zone` | `…/dns/zone` | BIND; import is full replace |
| Contact / NS / template CRUD | `/domains/contacts`, `/nameservers`, `/dns-templates` | |

### VPS

`list-vps`, `get-vps`, `update-vps` (PTR), `list-vps-images`, start/stop/restart, `poweroff-vps`, `reinstall-vps`, `set-vps-rescue-mode`, `reset-vps-password`, `cancel-vps`, `cancel-vps-deletion`, `list-vps-backups`, `create-vps-backup`, `restore-vps-backup`.

### Certificates

`list-certificate-products` → `order-certificate` (**bills immediately**) → `generate-csr` → `request-certificate` → poll `get-certificate` until `certificate_status` is `ACT`.

### Affiliate

`list-affiliate-commissions`, `get-affiliate-commission`, `list-affiliate-payments`, `get-affiliate-payment`.

## Development

```bash
git clone https://github.com/vitrionbv/mijn-host-mcp.git
cd mijn-host-mcp
npm install
cp .env.example .env   # then set MIJN_HOST_API_KEY
npm test
npm run typecheck
npm run build
```

```bash
# Inspector (official SDK workflow)
npx @modelcontextprotocol/inspector npx tsx src/index.ts

# stdio locally
npx tsx src/index.ts
```

This repo’s `.cursor/mcp.json` points at `tsx src/index.ts` for local development.

## Publishing (trusted / OIDC)

Releases use [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) — no long-lived `NPM_TOKEN`.

1. **First publish (human, once):** an npm owner of the `vitrion` account publishes `1.0.0` (`npm publish --access public`) *or* creates the package and attaches a trusted publisher.
2. On npmjs.com → package → **Trusted Publisher** → GitHub Actions:
   - Organization or user: `vitrionbv`
   - Repository: `mijn-host-mcp`
   - Workflow filename: `publish.yml`
3. Later releases: `git tag v1.2.3 && git push origin v1.2.3`. [`.github/workflows/publish.yml`](.github/workflows/publish.yml) runs `npm publish` with `id-token: write`. Provenance is attached automatically.

## License

[MIT](./LICENSE) © Vitrion B.V.

API © [mijn.host](https://mijn.host/). This project is not an official mijn.host product.
