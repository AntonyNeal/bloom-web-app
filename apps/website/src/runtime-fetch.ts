import { apiService } from './services/ApiService';
import { log } from './utils/logger';

// Lightweight runtime config fetcher used at app startup.
// Attempts to fetch a JSON from a runtime endpoint and merges values into window.__ENV_VARS__.
export async function loadRuntimeConfig(
  url: string,
  timeoutMs = 2000
): Promise<Record<string, unknown> | null> {
  try {
    const isAbsoluteUrl = /^https?:\/\//i.test(url);
    let json: Record<string, unknown> = {};

    if (isAbsoluteUrl) {
      const response = await apiService.get<Record<string, unknown>>(url, {
        timeout: timeoutMs,
      });

      if (!response.success) {
        log.error('Runtime config fetch failed', 'RuntimeFetch', response.error);
        return null;
      }

      json = response.data || {};
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'Cache-Control': 'no-cache',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          log.error(
            'Runtime config fetch failed',
            'RuntimeFetch',
            `Status ${response.status}`
          );
          return null;
        }

        json = ((await response.json()) as Record<string, unknown>) || {};
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    }

    // Check if we're in development and conditionally disable chat
    const isDevelopment = import.meta.env.MODE === 'development';
    if (isDevelopment && json.VITE_CHAT_ENABLED !== undefined) {
      json.VITE_CHAT_ENABLED = 'false';
    }

    type WindowWithEnv = Window & {
      __ENV_VARS__?: Record<string, unknown>;
    } & Record<string, unknown>;
    const w = window as unknown as WindowWithEnv;
    w.__ENV_VARS__ = Object.assign({}, w.__ENV_VARS__ || {}, json);
    Object.keys(json).forEach((k) => {
      // assign as unknown key on the window object
      (w as Record<string, unknown>)[k] = json[k];
    });
    return json;
  } catch (err: unknown) {
    const isAbort = (err as { name?: string })?.name === 'AbortError';
    console.error(
      '[RUNTIME] Failed to load runtime config from',
      url,
      isAbort ? ' (timeout)' : '',
      'Error:',
      err
    );
    return null;
  }
}
