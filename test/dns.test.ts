import { describe, expect, it } from 'vitest';
import { ensureTrailingDot, normalizeLiveDnsRecord } from '../src/dns.js';

describe('ensureTrailingDot', () => {
  it('appends a trailing dot to hostnames', () => {
    expect(ensureTrailingDot('example.com')).toBe('example.com.');
  });

  it('leaves FQDNs unchanged', () => {
    expect(ensureTrailingDot('www.example.com.')).toBe('www.example.com.');
  });

  it('leaves empty and apex markers unchanged', () => {
    expect(ensureTrailingDot('')).toBe('');
    expect(ensureTrailingDot('@')).toBe('@');
  });
});

describe('normalizeLiveDnsRecord', () => {
  it('normalizes the name field only', () => {
    expect(
      normalizeLiveDnsRecord({
        type: 'MX',
        name: 'example.com',
        value: '10 mail.example.com.',
        ttl: 900,
      }),
    ).toEqual({
      type: 'MX',
      name: 'example.com.',
      value: '10 mail.example.com.',
      ttl: 900,
    });
  });
});
