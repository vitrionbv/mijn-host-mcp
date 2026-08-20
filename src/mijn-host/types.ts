export interface MijnHostOkResponse {
  status?: number;
  status_description?: string;
  data?: unknown;
}

export interface MijnHostRequestOptions {
  method?: string;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  accept?: string;
}

export interface MijnHostBinaryResponse {
  contentType: string;
  encoding: "base64";
  data: string;
}
