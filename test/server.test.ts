import { describe, expect, it, vi } from 'vitest';
import { MijnHostClient } from '../src/client.js';
import { createServer } from '../src/server.js';
import { TOOL_NAMES } from '../src/tools/index.js';

type ToolResult = {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
};

type Registered = {
  handler: (args?: Record<string, unknown>) => Promise<ToolResult>;
};

function registeredTools(server: ReturnType<typeof createServer>): Record<string, Registered> {
  return (server as unknown as { _registeredTools: Record<string, Registered> })._registeredTools;
}

describe('createServer', () => {
  it('exposes the documented unique endpoint set', () => {
    expect(TOOL_NAMES).toHaveLength(77);
    expect(new Set(TOOL_NAMES).size).toBe(77);
  });

  it('registers every catalogued tool', () => {
    const server = createServer({
      client: new MijnHostClient({ apiKey: 'test-key', fetchImpl: vi.fn() }),
    });
    expect(Object.keys(registeredTools(server)).sort()).toEqual([...TOOL_NAMES].sort());
  });

  it('runs a read tool through the HTTP client', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 200,
          status_description: 'Request successful',
          data: { ip: '203.0.113.10', customer_id: 42 },
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const server = createServer({
      client: new MijnHostClient({ apiKey: 'test-key', fetchImpl }),
    });

    const result = await registeredTools(server).whoami.handler({});
    expect(result.isError).toBeUndefined();
    expect(result.content[0]).toMatchObject({ type: 'text' });
    expect(result.content[0]?.text).toContain('203.0.113.10');
    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe('https://mijn.host/api/v2/whoami');
  });

  it('normalizes DNS names and PATCHes a single record', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 200, status_description: 'ok' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    const server = createServer({
      client: new MijnHostClient({ apiKey: 'test-key', fetchImpl }),
    });

    await registeredTools(server)['update-dns-record'].handler({
      domain: 'example.com',
      record: { type: 'A', name: 'www.example.com', value: '1.2.3.4', ttl: 900 },
    });

    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe('https://mijn.host/api/v2/domains/example.com/dns');
    expect(init.method).toBe('PATCH');
    expect(JSON.parse(String(init.body))).toEqual({
      record: { type: 'A', name: 'www.example.com.', value: '1.2.3.4', ttl: 900 },
    });
  });

  it('returns isError when the API key is missing', async () => {
    const server = createServer({
      client: new MijnHostClient({ apiKey: '', fetchImpl: vi.fn() }),
    });
    const result = await registeredTools(server)['list-domains'].handler({});
    expect(result.isError).toBe(true);
    expect(result.content[0]?.text).toContain('MIJN_HOST_API_KEY');
  });
});
