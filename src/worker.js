/**
 * ForexTradeFi — Cloudflare Worker
 *
 * Serves the static site (public/) via the [assets] binding and adds one
 * server-side API route:
 *
 *   GET /api/news
 *     Merges Finnhub forex + crypto headlines into a single JSON payload.
 *     The Finnhub API key lives in the FINNHUB_KEY secret (set with
 *     `wrangler secret put FINNHUB_KEY`) and is NEVER exposed to the browser.
 *     Responses are edge-cached for 10 minutes to stay well inside Finnhub's
 *     free-tier rate limit.
 *
 * Everything else falls through to the static assets (index.html, journal.html,
 * og-image.png, ...).
 */

const NEWS_TTL = 600; // seconds — edge cache lifetime for /api/news
const NEWS_MAX = 12;  // headlines returned to the dashboard

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/news') {
      return handleNews(request, env, ctx);
    }

    if (url.pathname === '/api/subscribe') {
      return handleSubscribe(request, env);
    }

    // With html_handling = "none", assets are served at their literal path
    // (so /journal.html etc. keep working). Map the bare root to index.html.
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    // Static site (HTML, og-image.png, etc.)
    return env.ASSETS.fetch(request);
  },
};

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${NEWS_TTL}`,
      ...extraHeaders,
    },
  });
}

async function handleNews(request, env, ctx) {
  if (request.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed', articles: [] }, 405, {
      'cache-control': 'no-store',
    });
  }

  // Edge cache: serve a cached payload if we have a fresh one.
  const cache = caches.default;
  const cacheKey = new Request(new URL('/api/news', request.url).toString(), {
    method: 'GET',
  });
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const key = env.FINNHUB_KEY;
  if (!key) {
    // Key not configured yet — return an empty, non-error payload so the
    // dashboard degrades gracefully instead of showing a hard failure.
    return jsonResponse(
      { error: 'news_unconfigured', articles: [] },
      200,
      { 'cache-control': 'no-store' },
    );
  }

  try {
    const [fx, cx] = await Promise.all([
      fetchFinnhub('forex', key),
      fetchFinnhub('crypto', key),
    ]);

    const articles = [...fx, ...cx]
      .filter((a) => a && a.headline && a.url)
      .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
      .slice(0, NEWS_MAX)
      .map((a) => ({
        headline: a.headline,
        url: a.url,
        source: a.source || '',
        datetime: a.datetime || 0,
        category: a.category || '',
      }));

    const response = jsonResponse({ articles });
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    return jsonResponse({ error: 'news_fetch_failed', articles: [] }, 502, {
      'cache-control': 'no-store',
    });
  }
}

/**
 * Newsletter signup. Stores the email in the SUBSCRIBERS KV namespace
 * (free tier) so you own the list with zero cost and zero third-party
 * account. Enable it once with:
 *   npx wrangler kv namespace create SUBSCRIBERS
 * then uncomment the [[kv_namespaces]] block in wrangler.toml.
 *
 * Until KV is bound, the route returns a clear "not configured" response
 * instead of silently dropping signups.
 */
async function handleSubscribe(request, env) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, {
      'cache-control': 'no-store',
    });
  }

  let email = '';
  try {
    const body = await request.json();
    email = String((body && body.email) || '').trim().toLowerCase();
  } catch (e) {
    return jsonResponse({ ok: false, error: 'bad_request' }, 400, {
      'cache-control': 'no-store',
    });
  }

  // Basic validation — keep it simple and cheap.
  const valid = email.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!valid) {
    return jsonResponse({ ok: false, error: 'invalid_email' }, 422, {
      'cache-control': 'no-store',
    });
  }

  if (!env.SUBSCRIBERS) {
    return jsonResponse({ ok: false, error: 'not_configured' }, 503, {
      'cache-control': 'no-store',
    });
  }

  // Key on the email so re-submits just upsert (natural dedupe).
  await env.SUBSCRIBERS.put(
    `sub:${email}`,
    JSON.stringify({ email, ts: Date.now() }),
  );

  return jsonResponse({ ok: true }, 200, { 'cache-control': 'no-store' });
}

async function fetchFinnhub(category, key) {
  const res = await fetch(
    `https://finnhub.io/api/v1/news?category=${category}&token=${key}`,
    { cf: { cacheTtl: NEWS_TTL, cacheEverything: true } },
  );
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  // Tag each item with its category so the client can label it if it wants.
  return data.map((a) => ({ ...a, category }));
}
