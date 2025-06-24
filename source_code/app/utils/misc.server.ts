import { json } from "@remix-run/node";

/**
 * Combine multiple header objects into one (uses append so headers are not overridden)
 */
export function combineHeaders(...headers: Array<ResponseInit["headers"] | null | undefined>) {
  const combined = new Headers();
  for (const header of headers) {
    if (!header) {
      continue;
    }
    for (const [key, value] of new Headers(header).entries()) {
      combined.append(key, value);
    }
  }
  return combined;
}

const DEFAULT_REDIRECT = "/";

/**
 * This should be used any time the redirect path is user-provided
 * (Like the query string on our login/signup pages). This avoids
 * open-redirect vulnerabilities.
 * @param {string} to The redirect destination
 * @param {string} defaultRedirect The redirect to use if the to is unsafe.
 */
export function safeRedirect(
  to: FormDataEntryValue | null | string | undefined,
  defaultRedirect: string = DEFAULT_REDIRECT,
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

export const badRequest = <T = any>(data: T) => json<T>(data, { status: 400 });
export const unauthorized = <T = any>(data: T) => json<T>(data, { status: 401 });
export const forbidden = <T = any>(data: T) => json<T>(data, { status: 403 });
export const notFound = <T = any>(data: T) => json<T>(data, { status: 404 });
