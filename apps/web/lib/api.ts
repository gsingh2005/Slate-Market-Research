const configuredBase =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");
const requestTimeoutMs = 12_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind:
      | "configuration"
      | "network"
      | "cors"
      | "timeout"
      | "provider"
      | "validation"
      | "empty"
      | "stale"
      | "response",
  ) {
    super(message);
  }
}

export const apiConfiguration = {
  origin: configuredBase.replace(/\/+$/, "") || "same origin",
};

function apiBase(): URL {
  if (!configuredBase) {
    if (typeof window !== "undefined") return new URL(window.location.origin);
    throw new ApiError("The browser origin is unavailable while rendering.", "configuration");
  }
  try {
    const url = new URL(configuredBase);
    const isLocalHttp =
      url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname);
    if ((url.protocol !== "https:" && !isLocalHttp) || url.username || url.password) {
      throw new Error();
    }
    return url;
  } catch {
    throw new ApiError(
      "The configured API URL is invalid. Use a credential-free HTTPS URL.",
      "configuration",
    );
  }
}

export async function api<T>(path: string): Promise<T> {
  const base = apiBase();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  const url = new URL(`/api/v1/${path.replace(/^\/+/, "")}`, base);
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ApiError(
        response.status === 404
          ? "This symbol is not covered by the current provider."
          : response.status === 422
            ? "The request was not valid for this provider."
            : "The API is unavailable.",
        response.status === 422 ? "validation" : response.status >= 500 ? "provider" : "response",
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The API request timed out. Try again shortly.", "timeout");
    }
    throw new ApiError(
      "Unable to reach the API. Check its status or try again shortly.",
      "network",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function apiStatus<T>(path: "health" | "ready"): Promise<T> {
  const base = apiBase();
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetch(new URL(path, base), {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) throw new ApiError(`${path} check failed.`, "response");
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      `${path} check could not reach the backend. Check CORS and API availability.`,
      "network",
    );
  } finally {
    window.clearTimeout(timeout);
  }
}
export type Research = {
  profile: {
    symbol: string;
    name: string;
    sector: string;
    industry: string;
    market_cap: number;
    description: string;
    provider: string;
  };
  bars: {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  metrics: Record<string, number>;
  indicators: Record<string, (number | null)[]>;
  fundamentals: Record<string, number | string>;
  scores: Record<string, number | string | Record<string, number | string | null>>;
  risks: string[];
  data_notes: string[];
};
