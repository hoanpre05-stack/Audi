/** Lightweight cookie-consent store (GDPR / Google Consent Mode v2 aware). */
export type ConsentState = 'granted' | 'denied' | 'unset';

const STORAGE_KEY = 'cookie_consent_v1';
const EVENT_NAME = 'consent-change';

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unset';
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'granted' || value === 'denied' ? value : 'unset';
  } catch {
    return 'unset';
  }
}

export function setConsent(state: Exclude<ConsentState, 'unset'>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, state);
  } catch {
    /* ignore storage errors (private mode) */
  }
  window.dispatchEvent(new CustomEvent<ConsentState>(EVENT_NAME, { detail: state }));
}

export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) =>
    cb(((event as CustomEvent<ConsentState>).detail) || getConsent());
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}

/**
 * Whether advertising cookies may be used.
 * When consent is not required (e.g. non-EEA deployment) ads are always allowed.
 */
export function canUseAdvertising(consentRequired: boolean): boolean {
  if (!consentRequired) return true;
  return getConsent() === 'granted';
}

/** Push a Consent Mode v2 update to gtag if it is present. */
export function updateGoogleConsent(state: 'granted' | 'denied'): void {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== 'function') return;
  gtag('consent', 'update', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
  });
}