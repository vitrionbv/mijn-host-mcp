import { PACKAGE_NAME, PACKAGE_VERSION } from "../version.js";
import {
  MijnHostError,
  MijnHostRateLimitError,
  mijnHostErrorFromResponse,
  parseRetryAfter,
} from "./errors.js";
import { appendQueryParams } from "./query.js";
import type {
  MijnHostBinaryResponse,
  MijnHostRequestOptions,
} from "./types.js";

export const BASE_URL = "https://mijn.host/api/v2";
export const USER_AGENT = `${PACKAGE_NAME}/${PACKAGE_VERSION}`;

export interface MijnHostClientOptions {
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class MijnHostClient {
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: MijnHostClientOptions = {}) {
    const apiKey =
      options.apiKey ?? process.env.MIJN_HOST_API_KEY ?? process.env.MIJNHOST_API_KEY;
    if (!apiKey) {
      throw new Error("MIJN_HOST_API_KEY environment variable is required");
    }

    this.apiKey = apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async request(options: MijnHostRequestOptions): Promise<unknown> {
    return this.executeRequest(options, false);
  }

  private async executeRequest(
    options: MijnHostRequestOptions,
    isRetry: boolean,
  ): Promise<unknown> {
    const method = options.method ?? "GET";
    const path = appendQueryParams(options.path, options.query);
    const url = `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
    const accept = options.accept ?? "application/json";

    const headers: Record<string, string> = {
      "API-Key": this.apiKey,
      Accept: accept,
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    };

    let body: string | undefined;
    if (options.body !== undefined) {
      body = JSON.stringify(options.body);
    }

    const response = await this.fetchImpl(url, { method, headers, body });

    if (response.status === 429 && !isRetry) {
      const retryAfter = parseRetryAfter(response.headers) ?? 1;
      await sleep(retryAfter * 1000);
      return this.executeRequest(options, true);
    }

    if (!response.ok) {
      const errorBody = await readResponseBody(response);
      throw mijnHostErrorFromResponse(response.status, errorBody, response.headers);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/pdf") || options.accept === "application/pdf") {
      const buffer = Buffer.from(await response.arrayBuffer());
      return {
        contentType: contentType || "application/pdf",
        encoding: "base64",
        data: buffer.toString("base64"),
      } satisfies MijnHostBinaryResponse;
    }

    if (response.status === 204) {
      return { ok: true };
    }

    return readResponseBody(response);
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { MijnHostError, MijnHostRateLimitError };
