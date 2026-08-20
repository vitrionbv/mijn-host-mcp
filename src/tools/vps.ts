import type { McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import type { MijnHostClient } from "../mijn-host/client.js";
import { compactBody, encodePathSegment, registerJsonTool } from "./_shared.js";

const vpsId = z.union([z.string(), z.number()]).describe("VPS ID from list-vps.");

export function registerVpsTools(server: McpServer, client: MijnHostClient): void {
  registerJsonTool(
    server,
    "list-vps",
    {
      description: "List Virtual Private Server instances (GET /vps).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/vps" }),
  );

  registerJsonTool(
    server,
    "get-vps",
    {
      description:
        "Get VPS details including specs, network, tasks, and lock status (GET /vps/{id}).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) => client.request({ path: `/vps/${encodePathSegment(input.id)}` }),
  );

  registerJsonTool(
    server,
    "update-vps",
    {
      description:
        "Update VPS properties such as IP reverse DNS (PUT /vps/{id}).",
      inputSchema: z.object({
        id: vpsId,
        "ip-addresses": z
          .array(
            z.object({
              ip: z.string().describe("IPv4 or IPv6 address belonging to this VPS."),
              reverse: z.string().describe("PTR hostname (e.g. hostname.example.com)."),
            }),
          )
          .optional()
          .describe("IP address and reverse DNS pairs to update."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/vps/${encodePathSegment(input.id)}`,
        body: compactBody({ "ip-addresses": input["ip-addresses"] }) ?? {},
      }),
  );

  registerJsonTool(
    server,
    "start-vps",
    {
      description: "Start the VPS (POST /vps/{id}/start).",
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/start`,
      }),
  );

  registerJsonTool(
    server,
    "stop-vps",
    {
      description: "Soft (ACPI) shutdown of the VPS (POST /vps/{id}/stop).",
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/stop`,
      }),
  );

  registerJsonTool(
    server,
    "poweroff-vps",
    {
      description: "Hard power off the VPS (POST /vps/{id}/poweroff).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/poweroff`,
      }),
  );

  registerJsonTool(
    server,
    "restart-vps",
    {
      description: "Restart the VPS (POST /vps/{id}/restart).",
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/restart`,
      }),
  );

  registerJsonTool(
    server,
    "reset-vps-password",
    {
      description:
        "Generate and set a new root password. Returned once (POST /vps/{id}/reset-password).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/reset-password`,
      }),
  );

  registerJsonTool(
    server,
    "change-vps-hostname",
    {
      description: "Change the VPS hostname (PUT /vps/{id}/hostname).",
      inputSchema: z.object({
        id: vpsId,
        hostname: z.string().describe("New hostname."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/vps/${encodePathSegment(input.id)}/hostname`,
        body: { hostname: input.hostname },
      }),
  );

  registerJsonTool(
    server,
    "cancel-vps",
    {
      description:
        "Cancel a VPS at the end of the billing period (DELETE /vps/{id}).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "DELETE",
        path: `/vps/${encodePathSegment(input.id)}`,
      }),
  );

  registerJsonTool(
    server,
    "cancel-vps-deletion",
    {
      description: "Undo a pending VPS cancellation (PUT /vps/{id}/cancel-delete).",
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/vps/${encodePathSegment(input.id)}/cancel-delete`,
      }),
  );

  registerJsonTool(
    server,
    "update-vps-rescue",
    {
      description:
        "Enable or disable rescue mode (PUT /vps/{id}/rescue). Enabling restarts the VPS and returns a temporary admin password.",
      inputSchema: z.object({
        id: vpsId,
        enable: z.boolean().describe("true enables rescue mode; false disables it."),
      }),
    },
    async (input) =>
      client.request({
        method: "PUT",
        path: `/vps/${encodePathSegment(input.id)}/rescue`,
        body: { enable: input.enable },
      }),
  );

  registerJsonTool(
    server,
    "list-vps-images",
    {
      description:
        "List OS images for reinstall (GET /vps/images). Use an id as image_id on reinstall-vps.",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({}),
    },
    async () => client.request({ path: "/vps/images" }),
  );

  registerJsonTool(
    server,
    "reinstall-vps",
    {
      description:
        "Reinstall the VPS with an OS image. A new root password is returned (POST /vps/{id}/reinstall).",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        id: vpsId,
        image_id: z.union([z.string(), z.number()]).describe("OS image ID from list-vps-images."),
      }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/reinstall`,
        body: { image_id: input.image_id },
      }),
  );

  registerJsonTool(
    server,
    "list-vps-backups",
    {
      description: "List backups for a VPS (GET /vps/{id}/backups).",
      annotations: { readOnlyHint: true },
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({ path: `/vps/${encodePathSegment(input.id)}/backups` }),
  );

  registerJsonTool(
    server,
    "create-vps-backup",
    {
      description:
        "Create a VPS snapshot in the background (POST /vps/{id}/backups). Poll get-vps for progress.",
      inputSchema: z.object({ id: vpsId }),
    },
    async (input) =>
      client.request({
        method: "POST",
        path: `/vps/${encodePathSegment(input.id)}/backups`,
      }),
  );

  registerJsonTool(
    server,
    "restore-vps-backup",
    {
      description:
        "Restore a VPS from a backup (PATCH /vps/{id}/backups). Use key from list-vps-backups. Set type to incremental only for automated backups.",
      annotations: { destructiveHint: true },
      inputSchema: z.object({
        id: vpsId,
        key: z.number().int().describe("Backup key from list-vps-backups."),
        type: z
          .string()
          .optional()
          .describe('Use "incremental" only when restoring an automated backup.'),
      }),
    },
    async (input) =>
      client.request({
        method: "PATCH",
        path: `/vps/${encodePathSegment(input.id)}/backups`,
        body: compactBody({ key: input.key, type: input.type }),
      }),
  );
}
