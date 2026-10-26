import { env } from '../config/env';

export const USER_AGENT = `Readora/1.0 (contact: ${env.CONTACT_EMAIL})`;
export const DEFAULT_TIMEOUT_MS = 10_000;

/** The URL without its query string. Queries can carry API keys, so they never go into logs or errors. */
export const safeUrl = (url: string): string => {
  try {
    const { origin, pathname } = new URL(url);
    return `${origin}${pathname}`;
  } catch {
    return 'an unknown URL';
  }
};

export class HttpStatusError extends Error {
  constructor(
    public readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} from ${safeUrl(url)}`);
    this.name = 'HttpStatusError';
  }
}

export interface HttpOptions {
  /** Whole request, including reading the body. Defaults to 10 seconds. */
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * One fetch with a timeout, our User-Agent, redirects followed, and a single retry on a 5xx.
 * The timer keeps running while `read` consumes the body, so a stalled download cannot hang forever.
 */
async function request<T>(url: string, options: HttpOptions, read: (res: Response) => Promise<T>): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 1; ; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'User-Agent': USER_AGENT, ...options.headers },
      });
      if (res.status >= 500 && attempt === 1) {
        await res.body?.cancel();
        continue;
      }
      if (!res.ok) throw new HttpStatusError(res.status, url);
      return await read(res);
    } catch (error) {
      if (controller.signal.aborted) throw new Error(`${safeUrl(url)} did not answer within ${Math.round(timeoutMs / 1000)}s`);
      if (error instanceof TypeError) throw new Error(`Could not reach ${safeUrl(url)}`);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}

export const getJson = <T>(url: string, options: HttpOptions = {}): Promise<T> =>
  request(url, { ...options, headers: { Accept: 'application/json', ...options.headers } }, (res) => res.json() as Promise<T>);

/** Decodes with the charset from the Content-Type header, then a <meta charset>, then UTF-8. */
export const getText = (url: string, options: HttpOptions = {}): Promise<string> =>
  request(url, options, async (res) => {
    const bytes = await res.arrayBuffer();
    const fromHeader = /charset=([\w-]+)/i.exec(res.headers.get('content-type') ?? '')?.[1];
    const fromMeta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(new TextDecoder('latin1').decode(bytes.slice(0, 2048)))?.[1];
    try {
      return new TextDecoder(fromHeader ?? fromMeta ?? 'utf-8').decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  });
