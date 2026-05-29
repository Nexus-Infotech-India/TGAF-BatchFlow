import { message } from 'antd';

// Show one toast at a time — a newer toast replaces the previous one. This also
// collapses the "handler shows its own error + global interceptor shows one" pair
// into a single visible toast (the more specific one wins, since it fires last).
message.config({ maxCount: 1, duration: 3 });

// Suppress the exact same text firing twice within a short window.
const recent = new Map<string, number>();
const DEDUPE_MS = 1500;
function shouldShow(text: string): boolean {
  const now = Date.now();
  if (recent.size > 50) {
    for (const [k, t] of recent) if (now - t > DEDUPE_MS) recent.delete(k);
  }
  const last = recent.get(text);
  if (last && now - last < DEDUPE_MS) return false;
  recent.set(text, now);
  return true;
}

export function notifySuccess(text: string): void {
  if (text && shouldShow('s:' + text)) message.success(text);
}

export function notifyError(text: string): void {
  if (text && shouldShow('e:' + text)) message.error(text);
}

export function notifyWarning(text: string): void {
  if (text && shouldShow('w:' + text)) message.warning(text);
}

// Turn any axios/network failure into a plain-language sentence a non-technical
// user can act on. Prefers a friendly server-provided message for 4xx; never
// surfaces status codes, stack traces, or internal jargon.
export function humanizeError(error: any): string {
  // No HTTP response at all → couldn't reach the server.
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') return 'The request took too long. Please try again.';
    return "Can't reach the server. Please check your internet connection and try again.";
  }

  const status: number = error.response.status;
  const serverMsg: string | undefined = error.response.data?.error || error.response.data?.message;

  if (status === 400) return serverMsg || 'Please check your entries and try again.';
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return "You don't have permission to do this. Contact an admin if you need access.";
  if (status === 404) return serverMsg || "We couldn't find what you were looking for. It may have been removed.";
  if (status === 409) return serverMsg || 'This already exists. Please use a different value.';
  if (status >= 500) return 'Something went wrong on our end. Please try again in a moment.';
  return serverMsg || 'Something went wrong. Please try again.';
}
