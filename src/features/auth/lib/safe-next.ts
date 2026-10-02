/**
 * Sanitizes a `?next=` destination to a same-origin relative path.
 *
 * An unchecked `next` on a login page is an open redirect — the exact hole a
 * phishing link wants: `nexa.app/login?next=https://nexa-falso.app` sends the
 * student somewhere else *after* a genuine login, so the flow looks legitimate
 * the whole way through.
 *
 * The check parses against a throwaway origin instead of pattern-matching,
 * because the interesting attacks are all encoding tricks that a regex misses
 * and a URL parser normalizes: protocol-relative `//host`, backslashes that
 * some browsers fold into slashes, and smuggled control characters.
 */
export const DEFAULT_NEXT = '/hoje';

/** Never resolvable — any value that escapes to a real host changes `origin`. */
const SENTINEL_ORIGIN = 'http://nexa.invalid';

export function safeNext(next: string | null | undefined): string {
  if (!next) return DEFAULT_NEXT;

  const value = next.trim();

  // Cheap structural rejects first, before the parser normalizes them away.
  if (!value.startsWith('/')) return DEFAULT_NEXT;
  if (value.startsWith('//')) return DEFAULT_NEXT;
  if (value.startsWith('/\\')) return DEFAULT_NEXT;

  try {
    const url = new URL(value, SENTINEL_ORIGIN);
    // If anything in the string re-pointed the URL at another host, it shows up
    // here — this is the assertion that actually closes the hole.
    if (url.origin !== SENTINEL_ORIGIN) return DEFAULT_NEXT;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_NEXT;
  }
}
