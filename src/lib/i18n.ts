import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';

import en from '../translations/en.json';
import fr from '../translations/fr.json';
import es from '../translations/es.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr', 'es'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';
const initialLanguage: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
  deviceLanguage as SupportedLanguage
)
  ? (deviceLanguage as SupportedLanguage)
  : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    es: { translation: es },
  },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
