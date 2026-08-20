import type { McpServer } from "@modelcontextprotocol/server";
import type { ZodTypeAny } from "zod/v4";
import { MijnHostError } from "../mijn-host/errors.js";

export function jsonResult(data: unknown): {
  content: Array<{ type: "text"; text: string }>;
  structuredContent?: unknown;
} {
  return {
    content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
    structuredContent: data,
  };
}

export function errorResult(error: unknown): {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
} {
  if (error instanceof MijnHostError) {
    const payload: Record<string, unknown> = {
      status: error.status,
      message: error.message,
    };

    if (error.details !== undefined) {
      payload.details = error.details;
    }

    return {
      content: [{ type: "text", text: JSON.stringify(payload, null, 2) }],
      isError: true,
    };
  }

  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

export function compactBody(
  record: Record<string, unknown>,
): Record<string, unknown> | undefined {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      out[key] = value;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

export function encodePathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

type ToolAnnotations = {
  readOnlyHint?: boolean;
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
};

export function registerJsonTool<T extends ZodTypeAny>(
  server: McpServer,
  name: string,
  options: {
    description: string;
    inputSchema: T;
    annotations?: ToolAnnotations;
  },
  handler: (input: T["_output"]) => Promise<unknown>,
): void {
  server.registerTool(
    name,
    options as unknown as Parameters<McpServer["registerTool"]>[1],
    async (input) => {
      try {
        return jsonResult(await handler(input as T["_output"]));
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}
