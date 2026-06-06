// Google Consent Mode v2 — default to DENIED for everyone until Google's
// certified CMP (Privacy & messaging) records the user's choice. Loaded
// synchronously in <head> BEFORE the AdSense tag so no ad/analytics storage
// happens pre-consent. Self-hosted (not inline) to satisfy CSP script-src 'self'.
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  wait_for_update: 500,
});
