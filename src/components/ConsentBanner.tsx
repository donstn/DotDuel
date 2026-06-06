interface Props {
  onAccept: () => void;
  onDecline: () => void;
  onOpenPrivacy: () => void;
}

/**
 * RETIRED. Google's certified CMP (Privacy & messaging, loaded via the AdSense
 * tag in index.html) is now the single EU/UK/Swiss consent prompt for BOTH ads
 * and analytics, with Google Consent Mode gating storage until the user chooses.
 * This homemade banner is no longer shown — rendering null avoids a double
 * prompt. The call sites + props are left intact for a later cleanup pass.
 */
export function ConsentBanner(_props: Props) {
  return null;
}
