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

// Load AdSense only on the real site. On localhost/dev it can never serve and
// would just spam CSP + ad-verification (SODAR) iframe errors, so skip it.
(function () {
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
