import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/stores/app-store';
import { useCallback } from 'react';

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const language = useAppStore((s) => s.language);
  const setLanguageStore = useAppStore((s) => s.setLanguage);

  const setLanguage = useCallback(
    (lang: 'en' | 'kh' | 'zh') => {
      i18n.changeLanguage(lang);
      setLanguageStore(lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = 'ltr';
    },
    [i18n, setLanguageStore]
  );

  return { language, setLanguage, t };
}
