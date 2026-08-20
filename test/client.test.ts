import { describe, expect, it, vi } from 'vitest';
import { MijnHostClient } from '../src/client.js';
import { MijnHostApiError, MijnHostConfigError } from '../src/errors.js';

function jsonResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'content-type': 'application/json', ...init.headers },
  });
}

describe('MijnHostClient', () => {
  it('sends API-Key, Accept, and User-Agent', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: 200, status_description: 'Request successful', data: { ip: '1.2.3.4' } }),
    );
    const client = new MijnHostClient({ apiKey: 'test-key', fetchImpl });

    const result = await client.request({ method: 'GET', path: '/whoami' });

    expect(result).toMatchObject({ status: 200, data: { ip: '1.2.3.4' } });
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(String(url)).toBe('https://mijn.host/api/v2/whoami');
    const headers = init.headers as Record<string, string>;
    expect(headers['API-Key']).toBe('test-key');
    expect(headers.Accept).toBe('application/json');
    expect(headers['User-Agent']).toMatch(/^@vitrion\/mijn-host-mcp\//);
  });

  it('serializes query params and JSON bodies', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: 200, status_description: 'ok', data: {} }),
    );
    const client = new MijnHostClient({ apiKey: 'k', fetchImpl });

    await client.request({
      method: 'PUT',
      path: '/domains/example.com/dns',
      query: { tags: 'a,b', empty: undefined },
      body: { records: [] },
    });

    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    expect(url.searchParams.get('tags')).toBe('a,b');
    expect(url.searchParams.has('empty')).toBe(false);
    expect(init.method).toBe('PUT');
    expect(init.body).toBe(JSON.stringify({ records: [] }));
  });

  it('throws MijnHostConfigError without an API key', async () => {
    const client = new MijnHostClient({ apiKey: '', fetchImpl: vi.fn() });
    await expect(client.request({ method: 'GET', path: '/whoami' })).rejects.toBeInstanceOf(
      MijnHostConfigError,
    );
  });

  it('maps envelope errors including whitelist hints', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          status: 401,
          status_description: 'Remote IP address is not found in the API key whitelist',
        },
        { status: 401 },
      ),
    );
    const client = new MijnHostClient({ apiKey: 'k', fetchImpl });

    try {
      await client.request({ method: 'GET', path: '/domains' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(MijnHostApiError);
      const message = (err as MijnHostApiError).toAgentMessage();
      expect(message).toContain('whoami');
      expect(message).toContain('whitelist');
    }
  });

  it('treats HTTP 200 with status 400 in the envelope as an error', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      jsonResponse({ status: 400, status_description: 'DNS records not managed by mijn.host' }),
    );
    const client = new MijnHostClient({ apiKey: 'k', fetchImpl });

    await expect(client.request({ method: 'GET', path: '/domains/x.com/dns' })).rejects.toMatchObject({
      status: 400,
      statusDescription: 'DNS records not managed by mijn.host',
    });
  });

  it('returns PDF payloads as base64', async () => {
    const pdf = Buffer.from('%PDF-1.4 test');
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(pdf, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      }),
    );
    const client = new MijnHostClient({ apiKey: 'k', fetchImpl });
    const result = await client.request({ method: 'GET', path: '/account/invoices/100/pdf' });
    expect(result).toEqual({
      content_type: 'application/pdf',
      filename: '100.pdf',
      base64: pdf.toString('base64'),
    });
  });
});
