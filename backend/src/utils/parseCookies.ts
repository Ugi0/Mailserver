import { IncomingMessage } from "http";

export function parseCookies(req: IncomingMessage): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};

  return Object.fromEntries(
    header.split("; ").map(cookie => {
      const index = cookie.indexOf("=");
      const name = cookie.substring(0, index);
      const value = cookie.substring(index + 1);
      return [name, decodeURIComponent(value)];
    })
  );
}