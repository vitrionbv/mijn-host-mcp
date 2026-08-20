# Agent instructions — mijn.host MCP

This repository is the `@vitrion/mijn-host-mcp` server. It talks to `https://mijn.host/api/v2` with the `API-Key` header.

## Required env

- `MIJN_HOST_API_KEY` — from https://mijn.host/cp/ (API Access). Never log or commit it.
- Optional `MIJN_HOST_BASE_URL` — default `https://mijn.host/api/v2`.

If a tool returns a whitelist 401, call `whoami` and tell the user to add that outbound IP to the key.

## Tool rules

- **DNS:** prefer `update-dns-record` / `delete-dns-record`. `replace-dns-records` and `import-dns-zone` wipe the entire zone.
- **Live DNS MX:** priority lives inside `value`, e.g. `"10 mail.example.com."`. Template MX uses a separate `priority` field.
- **Names:** live DNS names should be FQDNs; the server appends a trailing dot when missing.
- **Billing:** `order-domain` and `order-certificate` charge immediately. Confirm with the user. Check `check-domain-availability` first; premium names need `accept_premium_price`.
- **Managed DNS:** `get-domain` → `managed_dns` must be true before DNS tools work. Switch with `update-domain` `nameserver: "default-mijnhost"`.
- **Renewals:** there is no renew endpoint. `cancel-domain` stops renewal; `cancel-domain-deletion` undoes it.
- **VPS:** prefer `stop-vps` over `poweroff-vps`. `reinstall-vps` / `restore-vps-backup` are destructive. Passwords from reset/reinstall/rescue are shown once.

## When to use what

| User intent | Tools |
|---|---|
| List / inspect domains | `list-domains`, `get-domain` |
| Change one DNS record | `get-dns-records` → `update-dns-record` |
| Register / transfer | `check-domain-availability` → `get-domain-extension` → `order-domain` → `list-orders` |
| Contacts / nameservers / templates | `list-*-profiles` / `list-dns-templates` then create/update |
| VPS power / backups | `list-vps`, `get-vps`, start/stop/restart, `list-vps-backups` |
| SSL | `list-certificate-products` → `order-certificate` → `generate-csr` → `request-certificate` → poll `get-certificate` |
| Billing / support | `list-invoices`, `create-ticket` |

## Local loop

```bash
npm install
npm test
npx @modelcontextprotocol/inspector npx tsx src/index.ts
```
