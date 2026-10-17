import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { I18nManager } from 'react-native';
import { initReactI18next } from 'react-i18next';

import { resolveLanguage, SUPPORTED_LANGUAGE_CODES } from '@/lib/i18n/languages';
import { resources, TRANSLATION_NAMESPACES } from '@/lib/i18n/resources';

export { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, resolveLanguage } from '@/lib/i18n/languages';
export type { SupportedLanguage } from '@/lib/i18n/languages';

// Languages whose script runs right to left. Adding Arabic is what turns on the
// real RTL layout; the rest are kept so the rule is not language-specific.
const RTL_LANGUAGE_BASE_CODES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ckb']);

export function isRtlLanguage(code?: string): boolean {
  if (!code) {
    return false;
  }
  return RTL_LANGUAGE_BASE_CODES.has(code.trim().toLowerCase().split('-')[0]);
}

// React Native resolves layout direction once, before the bridge starts, from
// values persisted in NSUserDefaults/SharedPreferences. Applying it here and on
// every language change means the direction is correct from the next launch, and
// the OS still supplies RTL immediately when the device language is already RTL.
function applyLayoutDirection(language: string) {
  try {
    const rtl = isRtlLanguage(language);
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);
    }
  } catch {
    // Native direction constants are unavailable on web.
  }
}

function getDeviceLanguageTags(): string[] {
  try {
    return getLocales()
      .map((locale) => locale.languageTag)
      .filter((tag): tag is string => Boolean(tag));
  } catch {
    return [];
  }
}

export const i18n = createInstance();
const initialLanguage = resolveLanguage(undefined, getDeviceLanguageTags());
applyLayoutDirection(initialLanguage);

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    ns: TRANSLATION_NAMESPACES,
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    returnNull: false,
    // Resources are bundled, so initialize synchronously and never render keys
    // before the first translation is available.
    initAsync: false,
  });
}

// Locale-aware formatting helpers read the active language here, so a manual
// language switch is reflected without threading the locale through call sites.
export function getFormatLocale(): string {
  return i18n.resolvedLanguage || i18n.language || 'en';
}

// Applies the persisted preference (or the OS locale when unset). Called after
// persistence hydration and whenever the preference changes.
export function changeAppLanguage(preference?: string) {
  const next = resolveLanguage(preference, getDeviceLanguageTags());
  applyLayoutDirection(next);
  if ((i18n.resolvedLanguage || i18n.language) === next) {
    return;
  }
  void i18n.changeLanguage(next);
}
