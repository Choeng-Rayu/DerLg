import i18nLib from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import kh from './locales/kh.json';
import zh from './locales/zh.json';

const savedLng = localStorage.getItem('i18nextLng');
const detected = savedLng || navigator.language.split('-')[0];
const lng = ['en', 'kh', 'zh'].includes(detected) ? detected : 'en';

i18nLib.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    kh: { translation: kh },
    zh: { translation: zh },
  },
  lng,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18nLib;
