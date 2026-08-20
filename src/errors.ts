export class MijnHostApiError extends Error {
  readonly status: number | string;
  readonly statusDescription: string;
  readonly body: unknown;

  constructor(status: number | string, statusDescription: string, body?: unknown) {
    super(statusDescription || `mijn.host API error (${status})`);
    this.name = 'MijnHostApiError';
    this.status = status;
    this.statusDescription = statusDescription;
    this.body = body;
  }

  toAgentMessage(): string {
    const parts = [`mijn.host API error ${this.status}: ${this.statusDescription}`];

    if (this.statusDescription.includes('whitelist')) {
      parts.push(
        'The API key has an IP whitelist. Call whoami to see the outbound IP, then add it in the mijn.host control panel (API Access).',
      );
    } else if (this.status === 401 || /api key/i.test(this.statusDescription)) {
      parts.push(
        'Set MIJN_HOST_API_KEY to a valid key from https://mijn.host/cp/. Expired keys must be recreated.',
      );
    } else if (this.status === 429) {
      parts.push('Rate limit exceeded. Wait and retry, especially after check-domain-availability.');
    } else if (/DNS records not managed/i.test(this.statusDescription)) {
      parts.push(
        'This domain is not on mijn.host managed DNS. Use update-domain with nameserver "default-mijnhost" first, or edit DNS at the current provider.',
      );
    }

    if (this.body !== undefined) {
      try {
        parts.push(JSON.stringify(this.body, null, 2));
      } catch {
        // ignore unserializable bodies
      }
    }

    return parts.join('\n');
  }
}

export class MijnHostConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MijnHostConfigError';
  }
}
