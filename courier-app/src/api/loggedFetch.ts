import { logger } from '../utils/logger';

let requestCounter = 0;

const serializeBody = (body: BodyInit | null | undefined): unknown => {
  if (body == null) return undefined;
  if (body instanceof FormData) return '[FormData]';
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return `[${typeof body}]`;
};

const parseResponseBody = async (res: Response): Promise<unknown> => {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text.length > 500 ? `${text.slice(0, 500)}…` : text;
  }
};

/**
 * Обёртка над fetch: в __DEV__ логирует каждый запрос и ответ в Metro.
 */
export const loggedFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit,
  tag = 'HTTP',
): Promise<Response> => {
  const id = ++requestCounter;
  const method = (init?.method ?? 'GET').toUpperCase();
  const url =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  logger.info(tag, `→ #${id} ${method} ${url}`, {
    headers: init?.headers,
    body: serializeBody(init?.body),
  });

  const startedAt = Date.now();

  try {
    const response = await fetch(input, init);
    const body = await parseResponseBody(response.clone());

    logger.info(
      tag,
      `← #${id} ${response.status} ${method} ${url} (${Date.now() - startedAt}ms)`,
      { ok: response.ok, body },
    );

    return response;
  } catch (error) {
    logger.error(
      tag,
      `✗ #${id} ${method} ${url} (${Date.now() - startedAt}ms)`,
      error,
    );
    throw error;
  }
};
