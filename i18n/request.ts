import { getRequestConfig } from 'next-intl/server';
import { cookies, headers } from 'next/headers';
import { DEFAULT_LOCALE, getSafeLocale } from '@/lib/i18n';

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const localeFromCookie = cookieStore.get('NEXT_LOCALE')?.value;

  const headerStore = await headers();
  const localeFromHeader = headerStore.get('X-NEXT-INTL-LOCALE');

  // ใช้ validator locale ที่รวมไว้ศูนย์เพื่อให้ค่า invalid หรือว่างไม่สามารถ
  // ทำให้ระบบพยายามโหลด message ของภาษาที่ไม่ได้รองรับได้
  const locale = getSafeLocale(localeFromCookie ?? localeFromHeader ?? DEFAULT_LOCALE);

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});