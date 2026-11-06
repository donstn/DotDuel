// Google Consent Mode v2 — default to DENIED for everyone until Google's
// certified CMP (Privacy & messaging) records the user's choice. Runs in <head>
// before AdSense so no ad/analytics storage happens pre-consent. Self-hosted
// (not inline) to satisfy CSP script-src 'self'.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
});

// Ads are off (ADS_ENABLED = false in src/ads.ts since 2026-11-06), so the
// AdSense script — and the Google ad-consent message it renders — is not
// loaded. To bring ads back, flip ADS_ENABLED and set this to true.
var DOTDUEL_ADS_ENABLED = false;

// Load AdSense only on the real site. On localhost/dev it can never serve and
// would just spam CSP + ad-verification (SODAR) iframe errors, so skip it.
(function () {
  if (!DOTDUEL_ADS_ENABLED) return;
  var h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h.endsWith('.local')) {
    return;
  }
  var s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src =
    'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1268043579532481';
  document.head.appendChild(s);
})();
