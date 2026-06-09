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

// Real AdMob banner unit (same publisher as the AdSense account). Banner-only v1.
const BANNER_AD_ID = 'ca-app-pub-1268043579532481/8790879910';

/**
 * Serve TEST ads while developing so we never generate invalid traffic on the
 * real unit (which can get the AdMob account flagged) and dodge policy issues
 * pre-launch. FLIP TO false for the production Play release so real ads serve.
 */
const ADMOB_TESTING = true;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

let initStarted = false;
let initDone = false;
let bannerCreated = false;
let bannerVisible = false;

/** Initialize AdMob + gather GDPR consent (UMP). Idempotent; native-only. */
export async function initNativeAds(): Promise<void> {
  if (!isNativeApp() || initStarted) return;
  if (!isAdsAllowedForThisUser()) return;
  initStarted = true;
  try {
    const info = await AdMob.requestConsentInfo();
    if (info.isConsentFormAvailable && info.status === AdmobConsentStatus.REQUIRED) {
      await AdMob.showConsentForm();
    }
    await AdMob.initialize();
    initDone = true;
  } catch (e) {
    console.warn('initNativeAds failed:', e);
  }
}

/** Show the bottom banner on ad-eligible screens. No-op on web / when gated. */
export async function showNativeBanner(): Promise<void> {
  if (!isNativeApp() || !isAdsAllowedForThisUser()) return;
  if (!initDone) await initNativeAds();
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
