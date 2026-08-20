export class MijnHostError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "MijnHostError";
    this.status = status;
    this.details = details;
  }
}

export class MijnHostUnauthorizedError extends MijnHostError {
  constructor(message = "Unauthorized — check MIJN_HOST_API_KEY") {
    super(401, message);
    this.name = "MijnHostUnauthorizedError";
  }
}

export class MijnHostForbiddenError extends MijnHostError {
  constructor(message = "Forbidden — insufficient permissions for this resource") {
    super(403, message);
    this.name = "MijnHostForbiddenError";
  }
}

export class MijnHostNotFoundError extends MijnHostError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "MijnHostNotFoundError";
  }
}

export class MijnHostValidationError extends MijnHostError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
    this.name = "MijnHostValidationError";
  }
}

export class MijnHostRateLimitError extends MijnHostError {
  readonly retryAfter?: number;

  constructor(message: string, retryAfter?: number) {
    super(429, message);
    this.name = "MijnHostRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export function mijnHostErrorFromResponse(
  status: number,
  body: unknown,
  headers: Headers,
): MijnHostError {
  const messageFromBody = extractErrorMessage(body);

  switch (status) {
    case 401:
      return new MijnHostUnauthorizedError(messageFromBody);
    case 403:
      return new MijnHostForbiddenError(messageFromBody);
    case 404:
      return new MijnHostNotFoundError(messageFromBody);
    case 400:
      return new MijnHostValidationError(
        messageFromBody ?? "Bad request",
        body,
      );
    case 429: {
      const retryAfter = parseRetryAfter(headers);
      return new MijnHostRateLimitError(
        messageFromBody ?? "Rate limit exceeded",
        retryAfter,
      );
    }
    default:
      return new MijnHostError(
        status,
        messageFromBody ?? `mijn.host API request failed with status ${status}`,
        body,
      );
  }
}

function extractErrorMessage(body: unknown): string | undefined {
  if (typeof body === "string" && body.trim()) {
    return body;
  }

  if (!body || typeof body !== "object") {
    return undefined;
  }

  const record = body as Record<string, unknown>;

  if (typeof record.status_description === "string") {
    return record.status_description;
  }

  if (typeof record.message === "string") {
    return record.message;
  }

  if (typeof record.error === "string") {
    return record.error;
  }

  return undefined;
}

export function parseRetryAfter(headers: Headers): number | undefined {
  const retryAfter = headers.get("Retry-After");
  if (retryAfter) {
    const seconds = Number.parseInt(retryAfter, 10);
    if (!Number.isNaN(seconds)) {
      return Math.min(seconds, 60);
    }
  }

  return undefined;
}
