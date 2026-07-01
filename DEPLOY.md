# Deploy Guide — forextradefi.com

Plain-English steps to put this site live on your Cloudflare account and switch
on the free money features. No coding needed for the recommended path.

Your files live in this GitHub repo. Cloudflare takes them from GitHub (or from
your computer) and serves them at forextradefi.com. You never drag-and-drop
individual files — one deploy uploads everything.

---

## Part 1 — Put the site live

### Option A (recommended): connect GitHub → Cloudflare (no terminal)

Do this once, and after that **every time you click "Merge" on GitHub, your site
updates itself automatically.**

1. Merge the open pull request on GitHub (the green **Merge pull request**
   button), so everything is on the `main` branch.
2. Go to **dash.cloudflare.com** → **Workers & Pages**.
3. Click **Create** → **Workers** → **Connect to Git** (or open your existing
   `forextradefi` worker → **Settings** → **Build** → **Connect**).
4. Pick the `forextradefi/Forextradefi` repository and the `main` branch.
5. When it asks for a build/deploy command, use:
   - **Deploy command:** `npx wrangler deploy`
   - (Leave build command empty.)
6. Click **Save and Deploy**. Cloudflare builds and publishes it.

Done — the site is live. From now on, merging on GitHub redeploys automatically.

### Option B: deploy from your computer (terminal)

1. Install Node.js (nodejs.org) if you don't have it.
2. Download the code: on the GitHub repo page, green **Code** button →
   **Download ZIP**, then unzip. (Or `git clone` if you know git.)
3. Open a terminal in that folder and run:
   ```bash
   npm install
   npx wrangler login      # opens your browser to log into Cloudflare
   npx wrangler deploy
   ```

---

## Part 2 — Make sure forextradefi.com points to the worker

If the site doesn't show at your domain after deploying:

1. In the worker → **Settings** → **Domains & Routes** → **Add** → **Custom
   domain** → type `forextradefi.com` (and add `www.forextradefi.com` too).
2. Because your DNS is already on Cloudflare, it wires up automatically.

---

## Part 3 — Switch on the free features

Each of these is optional and free. The site works without them.

### 3a. Live news (Finnhub)
Turns the "Market news" panel on.
- In the worker → **Settings** → **Variables and Secrets** → **Add** →
  type **Secret**, name `FINNHUB_KEY`, value = your Finnhub key (the ~20-char
  key from finnhub.io), then **Save**.
- Or by terminal: `npx wrangler secret put FINNHUB_KEY`

### 3b. Newsletter signups (store emails for free)
Makes the "Get updates" form actually save emails.
- By terminal (one time):
  ```bash
  npx wrangler kv namespace create SUBSCRIBERS
  ```
  It prints an `id`. Open `wrangler.toml`, find the commented
  `[[kv_namespaces]]` block near the bottom, paste the id in, and remove the
  `#` from those three lines. Deploy again.

### 3c. Banner ads (Google AdSense)
1. Make sure the site is live (you now have a privacy policy at
   `/privacy.html`, which Google requires).
2. Apply at **adsense.google.com** using `forextradefi.com`.
3. When approved, turn on **Auto ads** in AdSense, then:
   - Open `public/ads.js`, paste your `ca-pub-XXXXXXXXXXXXXXXX` id on the
     `ADSENSE_PUB` line.
   - Open `public/ads.txt`, replace `pub-0000000000000000` with your number.
   - Deploy again (or merge on GitHub if you used Option A).

### 3d. Affiliate links (your biggest earner)
- Join broker/prop-firm affiliate programs (free).
- Open `public/brokers.html`, find the lines marked
  `<!-- TODO: replace href ... -->`, and paste your affiliate links.
- Your GoatFundedTrader and Instant Funding links are already in.

### 3e. Playbook product (Gumroad)
- Create the product on **gumroad.com** (free; they take a cut only on sales).
- Open `public/playbook.html`, find the `TODO` near the "Get the Playbook"
  button, and paste your Gumroad product link.

---

## Part 4 — After the first deploy

- Re-scrape your link preview at the
  [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
  so WhatsApp and socials show the new share card.
- Submit `https://forextradefi.com/sitemap.xml` in
  [Google Search Console](https://search.google.com/search-console) so Google
  indexes your pages (free traffic).

---

## Quick reference — what each file is

| File | What it is |
|---|---|
| `public/index.html` | Homepage + live markets dashboard |
| `public/journal.html` | Free trading journal |
| `public/brokers.html` | Brokers & prop firms (affiliate money) |
| `public/playbook.html` | Playbook product page |
| `public/privacy.html` | Privacy policy (needed for ads) |
| `public/ads.js`, `ads.txt` | Google AdSense switch |
| `public/robots.txt`, `sitemap.xml` | SEO (helps Google find you) |
| `public/og-image.png`, `logo.png` | Share card + logo |
| `src/worker.js` | The engine: serves the site + `/api/news` + `/api/subscribe` |
| `wrangler.toml` | Deploy settings (don't edit unless following a step above) |
