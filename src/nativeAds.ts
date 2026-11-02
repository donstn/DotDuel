/**
 * Native (Capacitor / Android) ad layer — AdMob, the compliant in-app path.
 *
 * On the WEB the app keeps using AdSense (src/ads.ts + AdBanner). In the native
 * app AdSense is forbidden by Google policy, so we show a native AdMob banner
 * instead and gate ad consent through UMP (the app equivalent of the web CMP).
 *
 * The same ads-policy gates as the web apply (isAdsAllowedForThisUser): master
 * kill-switch + early-adopter grandfather. No ads in ranked multiplayer — the
 * caller (App.tsx) hides the banner on the matchFound/mpgame screens.
 */
import { Capacitor } from '@capacitor/core';
import {
  AdMob,
  AdmobConsentStatus,
  BannerAdPluginEvents,
  BannerAdPosition,
  BannerAdSize,
  type BannerAdOptions,
} from '@capacitor-community/admob';
import { isAdsAllowedForThisUser } from './ads';

// Banner ad units. The real unit (same publisher as AdSense) is requested only
// in production. A BRAND-NEW real unit returns NO_FILL on test devices, and
// isTesting alone does NOT force test ads onto it — so while developing we must
// also use Google's sample/test unit, which always fills with a test ad.
const REAL_BANNER_ID = 'ca-app-pub-1268043579532481/8790879910';
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'; // Google sample banner

/**
 * Real ads are an explicit OPT-IN: only `npm run build:android-release`
 * (vite --mode androidrelease, which loads .env.androidrelease) serves the
 * real unit. Every other build — dev server, plain `npm run build`, emulator
 * testing via cap sync — uses the test unit + test-device flag, so the real
 * unit can never collect fake impressions (which can flag the AdMob account).
 * Fail-safe direction: forgetting the special build = no revenue, not a ban.
 */
const ADMOB_TESTING = import.meta.env.VITE_ADMOB_REAL !== '1';
const BANNER_AD_ID = ADMOB_TESTING ? TEST_BANNER_ID : REAL_BANNER_ID;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// A SHARED init promise so concurrent callers (boot effect + the first screen
// effect) await the SAME initialization instead of one of them early-returning
// before init finishes and then never showing the banner.
let initPromise: Promise<void> | null = null;
let initDone = false;
let bannerCreated = false;
let bannerVisible = false;

// Sideways phones get the standard 320x50 banner, centred, with the footer
// beside it (styles.css); portrait gets the full-width adaptive banner.
const sideways = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
let bannerOp: Promise<void> = Promise.resolve();

function serial(op: () => Promise<void>): Promise<void> {
  bannerOp = bannerOp.then(op, op);
  return bannerOp;
}

async function rebuildBanner(): Promise<void> {
  await serial(async () => {
    if (!bannerCreated) return;
    try {
      await AdMob.removeBanner();
    } catch (e) {
      console.warn('removeBanner failed:', e);
    }
    bannerCreated = false;
    if (bannerVisible) {
      bannerVisible = false;
      await openBanner();
    }
  });
}

/** Initialize AdMob + gather GDPR consent (UMP). Native-only; runs once. */
export function initNativeAds(): Promise<void> {
  if (!isNativeApp() || !isAdsAllowedForThisUser()) return Promise.resolve();
  if (!initPromise) {
    initPromise = (async () => {
      // UMP consent is BEST-EFFORT: a publisher-config error (e.g. no consent
      // message set up yet in the AdMob console) must not block ad init. EEA
      // users still need a real message configured before launch.
      try {
        const info = await AdMob.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
          await AdMob.showConsentForm();
        }
      } catch (e) {
        console.warn('UMP consent unavailable (configure messaging in AdMob):', e);
      }
      try {
        await AdMob.initialize();
        initDone = true;
        // Adaptive banners are 50–90dp tall depending on the phone; reserve
        // the real height (dp = CSS px in the WebView). Hide reports 0 — keep
        // the last height then, the body class already drops the reserve.
        void AdMob.addListener(BannerAdPluginEvents.SizeChanged, ({ width, height }) => {
          if (height > 0) {
            document.documentElement.style.setProperty('--native-banner-h', `${height}px`);
            document.documentElement.style.setProperty('--native-banner-w', `${width}px`);
          }
        });
        // The plugin sizes and centres the banner once, when it is created,
        // so after a rotation it is rebuilt for the new screen.
        sideways.addEventListener('change', () => void rebuildBanner());
      } catch (e) {
        console.warn('AdMob initialize failed:', e);
      }
    })();
  }
  return initPromise;
}

/** Show the bottom banner on ad-eligible screens. No-op on web / when gated. */
export async function showNativeBanner(): Promise<void> {
  if (!isNativeApp() || !isAdsAllowedForThisUser()) return;
  await initNativeAds(); // await the shared init (no early-return race)
  await serial(openBanner);
}

async function openBanner(): Promise<void> {
  if (!initDone || bannerVisible) return;
  try {
    if (!bannerCreated) {
      const opts: BannerAdOptions = {
        adId: BANNER_AD_ID,
        adSize: sideways.matches ? BannerAdSize.BANNER : BannerAdSize.ADAPTIVE_BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: ADMOB_TESTING,
      };
      await AdMob.showBanner(opts);
      bannerCreated = true;
    } else {
      await AdMob.resumeBanner();
    }
    bannerVisible = true;
    document.body.classList.add('has-native-banner');
  } catch (e) {
    console.warn('showNativeBanner failed:', e);
  }
}

/** Hide the banner (e.g. entering a ranked game). Keeps it loaded for resume. */
export async function hideNativeBanner(): Promise<void> {
  if (!isNativeApp()) return;
  await serial(async () => {
    if (!bannerVisible) return;
    try {
      await AdMob.hideBanner();
    } catch (e) {
      console.warn('hideNativeBanner failed:', e);
    }
    bannerVisible = false;
    document.body.classList.remove('has-native-banner');
  });
}
