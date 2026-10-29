'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import frMessages from '../messages/fr.json';
import arMessages from '../messages/ar.json';

export type Locale = 'fr' | 'ar';

interface LocaleContextType {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  dir: 'ltr' | 'rtl';
}

const LocaleContext = createContext<LocaleContextType>({
  locale: 'fr',
  setLocale: () => {},
  dir: 'ltr',
});

export const useLocale = () => useContext(LocaleContext);

function readSavedLocale(): Locale {
  if (typeof document === 'undefined') return 'fr';
  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith('NEXT_LOCALE='))
    ?.slice('NEXT_LOCALE='.length) as Locale | undefined;
  const local = localStorage.getItem('app_locale') as Locale | null;
  return cookie === 'ar' || local === 'ar' ? 'ar' : 'fr';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    setLocaleState(readSavedLocale());
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('app_locale', newLocale);
    // Mirror to the NEXT_LOCALE cookie so the server can render the correct
    // language and direction on first paint for the next request.
    document.cookie = `NEXT_LOCALE=${newLocale}; max-age=31536000; SameSite=Lax`;
  };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const messages = locale === 'ar' ? arMessages : frMessages;

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, dir }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Choix de langue"
      className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 text-xs font-medium"
    >
      <button
        type="button"
        aria-pressed={locale === 'fr'}
        onClick={() => setLocale('fr')}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
          locale === 'fr'
            ? 'bg-white text-terracotta-700 shadow-sm font-semibold'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        FR
      </button>
      <button
        type="button"
        aria-pressed={locale === 'ar'}
        onClick={() => setLocale('ar')}
        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-display ${
          locale === 'ar'
            ? 'bg-white text-terracotta-700 shadow-sm font-semibold'
            : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        العربية
      </button>
    </div>
  );
}
