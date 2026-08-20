import { MijnHostApiError, MijnHostConfigError } from './errors.js';
import { DEFAULT_BASE_URL, PACKAGE_NAME, PACKAGE_VERSION } from './version.js';

export interface MijnHostClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

export interface PdfPayload {
  content_type: 'application/pdf';
  filename: string;
  base64: string;
}

function joinUrl(baseUrl: string, path: string): string {
  const base = baseUrl.replace(/\/+$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${base}${suffix}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export class MijnHostClient {
  readonly apiKey: string;
  readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MijnHostClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request<T = unknown>(options: RequestOptions): Promise<T> {
    if (!this.apiKey) {
      throw new MijnHostConfigError(
        'MIJN_HOST_API_KEY is not set. Create a key at https://mijn.host/cp/ (API Access) and pass it in the MCP host env.',
      );
    }

    const url = new URL(joinUrl(this.baseUrl, options.path));
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value === undefined || value === null || value === '') {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }

    const headers: Record<string, string> = {
      'API-Key': this.apiKey,
      Accept: 'application/json',
      'User-Agent': `${PACKAGE_NAME}/${PACKAGE_VERSION}`,
    };

    const init: RequestInit = { method: options.method, headers };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(url, init);
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/pdf')) {
      if (!response.ok) {
        const text = await response.text();
        throw new MijnHostApiError(response.status, text || response.statusText);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      const payload: PdfPayload = {
        content_type: 'application/pdf',
        filename: `${options.path.split('/').filter(Boolean).at(-2) ?? 'invoice'}.pdf`,
        base64: bytes.toString('base64'),
      };
      return payload as T;
    }

    const text = await response.text();
    let parsed: unknown = undefined;
    if (text.length > 0) {
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        if (!response.ok) {
          throw new MijnHostApiError(response.status, text || response.statusText, text);
        }
        throw new MijnHostApiError(response.status, 'Response was not valid JSON', text);
      }
    }

    if (isRecord(parsed) && 'status' in parsed) {
      const status = parsed.status as number | string;
      const description =
        typeof parsed.status_description === 'string' ? parsed.status_description : response.statusText;
      const numeric = typeof status === 'number' ? status : Number(status);
      const failed = status === 'error' || (Number.isFinite(numeric) && numeric >= 400);
      if (failed || !response.ok) {
        throw new MijnHostApiError(status, description, parsed);
      }
      return parsed as T;
    }

    if (!response.ok) {
      throw new MijnHostApiError(response.status, text || response.statusText, parsed ?? text);
    }

    return (parsed ?? { status: response.status, status_description: response.statusText }) as T;
  }
}

export function createClientFromEnv(fetchImpl?: typeof fetch): MijnHostClient {
  return new MijnHostClient({
    apiKey: process.env.MIJN_HOST_API_KEY ?? '',
    baseUrl: process.env.MIJN_HOST_BASE_URL,
    fetchImpl,
  });
}
