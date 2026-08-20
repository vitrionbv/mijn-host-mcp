import type { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import type { MijnHostClient } from '../client.js';
import { annotations, runTool } from '../result.js';
import { idParam } from '../schemas.js';

const vpsId = idParam.describe('VPS product id from list-vps');

export function registerVpsTools(server: McpServer, client: MijnHostClient): void {
  server.registerTool(
    'list-vps',
    {
      title: 'List VPS instances',
      description: 'List Virtual Private Servers. Use each id with the other VPS tools.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/vps' })),
  );

  server.registerTool(
    'list-vps-images',
    {
      title: 'List VPS OS images',
      description: 'List OS images. Use an image id as image_id on reinstall-vps.',
      inputSchema: z.object({}),
      annotations: annotations.readOnly,
    },
    async () => runTool(() => client.request({ method: 'GET', path: '/vps/images' })),
  );

  server.registerTool(
    'get-vps',
    {
      title: 'Get VPS',
      description:
        'VPS details including specs, network, and status (details.tasks, details.vps_locked). Poll after backup/reinstall/restore.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.readOnly,
    },
    async ({ id }) => runTool(() => client.request({ method: 'GET', path: `/vps/${id}` })),
  );

  server.registerTool(
    'update-vps',
    {
      title: 'Update VPS reverse DNS',
      description: 'Update PTR / reverse DNS for IPs that belong to this VPS.',
      inputSchema: z.object({
        id: vpsId,
        ip_addresses: z
          .array(
            z.object({
              ip: z.string().describe('IPv4 or IPv6 that belongs to this VPS'),
              reverse: z.string().describe('PTR hostname, e.g. host.example.com'),
            }),
          )
          .min(1)
          .describe('IP + reverse DNS pairs'),
      }),
      annotations: annotations.write,
    },
    async ({ id, ip_addresses }) =>
      runTool(() =>
        client.request({
          method: 'PUT',
          path: `/vps/${id}`,
          body: { 'ip-addresses': ip_addresses },
        }),
      ),
  );

  server.registerTool(
    'cancel-vps',
    {
      title: 'Cancel VPS',
      description: 'Cancel a VPS at the end of the billing period. Use cancel-vps-deletion to undo.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.destructive,
    },
    async ({ id }) => runTool(() => client.request({ method: 'DELETE', path: `/vps/${id}` })),
  );

  server.registerTool(
    'cancel-vps-deletion',
    {
      title: 'Undo VPS cancellation',
      description: 'Restore a VPS that is scheduled for deletion.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.writeIdempotent,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'PUT', path: `/vps/${id}/cancel-delete` })),
  );

  server.registerTool(
    'change-vps-hostname',
    {
      title: 'Change VPS hostname',
      description: 'Set the VPS hostname.',
      inputSchema: z.object({
        id: vpsId,
        hostname: z.string().describe('New hostname'),
      }),
      annotations: annotations.write,
    },
    async ({ id, hostname }) =>
      runTool(() => client.request({ method: 'PUT', path: `/vps/${id}/hostname`, body: { hostname } })),
  );

  server.registerTool(
    'poweroff-vps',
    {
      title: 'Power off VPS',
      description: 'Hard power off. Prefer stop-vps (ACPI) unless the guest is unresponsive.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.destructive,
    },
    async ({ id }) => runTool(() => client.request({ method: 'POST', path: `/vps/${id}/poweroff` })),
  );

  server.registerTool(
    'reinstall-vps',
    {
      title: 'Reinstall VPS',
      description:
        'DESTRUCTIVE: wipe and reinstall from an OS image (list-vps-images). A new root password is returned once. To restore data use restore-vps-backup instead.',
      inputSchema: z.object({
        id: vpsId,
        image_id: z.number().int().positive().describe('OS image id from list-vps-images'),
      }),
      annotations: annotations.destructive,
    },
    async ({ id, image_id }) =>
      runTool(() => client.request({ method: 'POST', path: `/vps/${id}/reinstall`, body: { image_id } })),
  );

  server.registerTool(
    'set-vps-rescue-mode',
    {
      title: 'Set VPS rescue mode',
      description:
        'Enable or disable rescue mode. Enabling restarts into rescue and returns a temporary admin password.',
      inputSchema: z.object({
        id: vpsId,
        enable: z.boolean().describe('true enables rescue mode, false disables it'),
      }),
      annotations: annotations.write,
    },
    async ({ id, enable }) =>
      runTool(() => client.request({ method: 'PUT', path: `/vps/${id}/rescue`, body: { enable } })),
  );

  server.registerTool(
    'reset-vps-password',
    {
      title: 'Reset VPS root password',
      description: 'Generate a new root password. It is returned once — show it to the user immediately.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.destructive,
    },
    async ({ id }) =>
      runTool(() => client.request({ method: 'POST', path: `/vps/${id}/reset-password` })),
  );

  server.registerTool(
    'restart-vps',
    {
      title: 'Restart VPS',
      description: 'Restart the VPS.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.write,
    },
    async ({ id }) => runTool(() => client.request({ method: 'POST', path: `/vps/${id}/restart` })),
  );

  server.registerTool(
    'start-vps',
    {
      title: 'Start VPS',
      description: 'Start a stopped VPS.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.write,
    },
    async ({ id }) => runTool(() => client.request({ method: 'POST', path: `/vps/${id}/start` })),
  );

  server.registerTool(
    'stop-vps',
    {
      title: 'Stop VPS',
      description: 'Soft ACPI shutdown. Use poweroff-vps for a hard power off.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.write,
    },
    async ({ id }) => runTool(() => client.request({ method: 'POST', path: `/vps/${id}/stop` })),
  );

  server.registerTool(
    'list-vps-backups',
    {
      title: 'List VPS backups',
      description: 'List backups. Use key with restore-vps-backup.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.readOnly,
    },
    async ({ id }) => runTool(() => client.request({ method: 'GET', path: `/vps/${id}/backups` })),
  );

  server.registerTool(
    'create-vps-backup',
    {
      title: 'Create VPS backup',
      description: 'Create a snapshot. Runs in the background — poll get-vps for details.tasks / vps_locked.',
      inputSchema: z.object({ id: vpsId }),
      annotations: annotations.write,
    },
    async ({ id }) => runTool(() => client.request({ method: 'POST', path: `/vps/${id}/backups` })),
  );

  server.registerTool(
    'restore-vps-backup',
    {
      title: 'Restore VPS backup',
      description:
        'DESTRUCTIVE: restore from a backup key. Set type "incremental" only for automated backups. Poll get-vps for progress.',
      inputSchema: z.object({
        id: vpsId,
        key: z.number().int().describe('Backup key from list-vps-backups'),
        type: z.enum(['incremental']).optional().describe('Only for automated/incremental backups'),
      }),
      annotations: annotations.destructive,
    },
    async ({ id, ...body }) =>
      runTool(() => client.request({ method: 'PATCH', path: `/vps/${id}/backups`, body })),
  );
}
