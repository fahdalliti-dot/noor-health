import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { routing } from './i18n/routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Prefer the server-readable cookie, fall back to the request locale,
  // then to the default. This lets the locale switcher set a cookie so the
  // server can render the correct language and direction on first paint.
  const cookieLocale = cookies().get('NEXT_LOCALE')?.value as
    | (typeof routing.locales)[number]
    | undefined;

  const reqLoc = await requestLocale;
  let locale = cookieLocale ?? reqLoc ?? routing.defaultLocale;

  if (!routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    timeZone: 'Africa/Casablanca',
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});