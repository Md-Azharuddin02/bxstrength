// Vercel Routing Middleware: sends /api/* to the backend for this deployment, so the staging site talks to
// the staging API and production to the production API, while the browser only ever calls the site's own
// domain (login cookies, including the readable CSRF cookie, stay first-party).
//
// The backend is chosen from the site's hostname, so no Vercel setting is needed. API_PROXY_TARGET, if set
// for a deployment, overrides it.

export const config = { matcher: '/api/:path*' };

const PRODUCTION_API = 'https://bxstrength-api.onrender.com';
const STAGING_API = 'https://bxstrength-stg.onrender.com';

// bxstrength-stg.vercel.app, plus Vercel's preview URLs for the Staging branch (…-git-staging-….vercel.app).
const isStagingHost = (host: string) => /(^|[.-])stg[.-]|-git-staging-/i.test(host);

export function apiTarget(host: string): string {
  return (process.env.API_PROXY_TARGET || (isStagingHost(host) ? STAGING_API : PRODUCTION_API)).replace(/\/$/, '');
}

export default function middleware(request: Request): Response {
  const { hostname, pathname, search } = new URL(request.url);
  // Same as `rewrite()` from @vercel/functions: Vercel's edge proxies the request (no function body limit).
  return new Response(null, { headers: { 'x-middleware-rewrite': `${apiTarget(hostname)}${pathname}${search}` } });
}
