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
 * TRUE while developing: use the test unit + flag the device as a test device,
 * so the real unit never gets fake impressions (which can flag the AdMob
 * account). FLIP TO false for the production Play release so real ads serve.
 */
const ADMOB_TESTING = true;
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
  if (!initDone || bannerVisible) return;
  try {
    if (!bannerCreated) {
      const opts: BannerAdOptions = {
        adId: BANNER_AD_ID,
        adSize: BannerAdSize.ADAPTIVE_BANNER,
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
  if (!isNativeApp() || !bannerVisible) return;
  try {
    await AdMob.hideBanner();
  } catch (e) {
    console.warn('hideNativeBanner failed:', e);
  }
  bannerVisible = false;
  document.body.classList.remove('has-native-banner');
}
