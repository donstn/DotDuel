import { useT } from '../i18n';

/** Themed rule + "Advertisement" label above the native AdMob banner, so the
 *  ad reads as separate from the app. Shown only while body has
 *  has-native-banner (nativeAds.ts). */
export function NativeAdDivider() {
  const t = useT();
  return (
    <div className="native-ad-divider" aria-hidden="true">
      <span className="native-ad-label">{t.common.advertisement}</span>
    </div>
  );
}
