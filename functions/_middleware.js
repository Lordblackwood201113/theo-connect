// Cloudflare Pages Function — reverse-proxy ODK Central backend paths to job-tracker.fr.
// Mirrors the nginx.conf used in the Coolify deploy so cookies stay same-origin.

const ORIGIN = 'https://job-tracker.fr';
const ORIGIN_HOST = 'job-tracker.fr';

const PREFIX_ROUTES = ['/v1', '/-', '/enketo-passthrough'];
const EXACT_ROUTES = ['/client-config.json', '/version.txt'];

function shouldProxy(pathname) {
  if (EXACT_ROUTES.includes(pathname)) return true;
  return PREFIX_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const onRequest = async ({ request, next }) => {
  const url = new URL(request.url);

  if (!shouldProxy(url.pathname)) return next();

  const headers = new Headers(request.headers);
  headers.set('Host', ORIGIN_HOST);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', 'https');

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body;
  }

  const upstream = await fetch(`${ORIGIN}${url.pathname}${url.search}`, init);
  const response = new Response(upstream.body, upstream);

  // Strip Domain= so Set-Cookie binds to the current host (theo-connect.locagri-app.com),
  // mirroring nginx `proxy_cookie_domain job-tracker.fr $host`.
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length) {
    response.headers.delete('Set-Cookie');
    for (const cookie of setCookies) {
      response.headers.append('Set-Cookie', cookie.replace(/;\s*Domain=[^;]+/gi, ''));
    }
  }

  return response;
};
