export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  RESET_PASSWORD?: string;
  WORKER_VERSION?: string;
  ALLOWED_ORIGINS?: string;
  ENABLE_REQUEST_LOGGING?: string;
}

export interface ApiErrorBody {
  error: string;
  retryAfterSeconds?: number;
}
