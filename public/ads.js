/*
 * Google AdSense loader for ForexTradeFi.
 *
 * HOW TO TURN ON BANNER ADS (free):
 *  1. Add a privacy policy — done: /privacy.html
 *  2. Apply at https://adsense.google.com with the domain forextradefi.com
 *  3. In AdSense, turn on "Auto ads" for the site (Google places the banners
 *     for you — no code per slot needed)
 *  4. Paste your publisher id on the line below (looks like
 *     "ca-pub-1234567890123456") and redeploy
 *  5. Update /ads.txt with the same publisher number
 *
 * Until a publisher id is set, this does nothing — the live site stays clean.
 */
var ADSENSE_PUB = ""; // <-- paste your "ca-pub-..." id here

(function () {
  if (!ADSENSE_PUB) return;
  var s = document.createElement('script');
  s.async = true;
  s.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' +
    encodeURIComponent(ADSENSE_PUB);
  s.crossOrigin = 'anonymous';
  document.head.appendChild(s);
})();
