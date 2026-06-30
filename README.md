# ForexTradeFi — forextradefi.com

Vanilla HTML/CSS/JS site served from a Cloudflare Worker. Firebase (Firestore +
Google Sign-In) powers the free trading journal. Live FX via frankfurter.app;
TradingView embeds, CoinGecko and alternative.me power the Live Markets
dashboard; market news comes from Finnhub through a server-side Worker route.

## Layout

```
public/            Static site (served via the Worker's [assets] binding)
  index.html       Homepage: hero + Live Markets dashboard + sections + footer
  journal.html     Free trading journal (Firebase auth + Firestore)
  og-image.png     1200x630 social share card -> https://forextradefi.com/og-image.png
src/
  worker.js        Worker: static assets + GET /api/news
wrangler.toml      Cloudflare Worker config
```

## Deploy

```bash
npm install
npx wrangler deploy
```

`public/og-image.png` is served verbatim at `https://forextradefi.com/og-image.png`
(referenced by the Open Graph / Twitter tags in `index.html` and `journal.html`).
After deploying, re-scrape the link preview in the
[Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) so
WhatsApp and other socials pick up the new card.

## News feed — `/api/news`

The dashboard fetches `/api/news`. The Worker calls Finnhub server-side using a
secret, merges the `forex` + `crypto` categories, sorts by recency, returns the
top 12 as `{ "articles": [{ headline, url, source, datetime, category }] }`, and
edge-caches the result for 10 minutes. The Finnhub key is never sent to the
browser.

Set the key once (free tier at https://finnhub.io):

```bash
npx wrangler secret put FINNHUB_KEY
```

Until the secret is set, `/api/news` returns `{ "articles": [] }` and the
dashboard shows a friendly "check back soon" message instead of failing.

### Local dev

```bash
cp .dev.vars.example .dev.vars   # then paste your key
npx wrangler dev                 # http://localhost:8787
```

## Optional — CoinGecko demo key

The BTC/ETH and trending-coin cards use CoinGecko's free public API. If they
start rate-limiting, add a free [CoinGecko demo key](https://www.coingecko.com/en/api)
and send it as the `x-cg-demo-api-key` header (ideally proxied through the
Worker, same pattern as `/api/news`, so the key stays server-side).
