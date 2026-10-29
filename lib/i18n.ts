// นิยาม locale แบบรวมศูนย์เพื่อให้แอปมีแหล่งข้อมูลเดียว
// สำหรับภาษาที่รองรับและการ fallback ที่ปลอดภัย
export const LOCALES = ['th', 'en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'th';

// บังคับให้การจัดการ locale เป็นแบบเข้มงวด: เฉพาะภาษาที่รู้จักเท่านั้นที่ยอมรับ
// หากมีค่าอื่นจะ fallback กลับเป็นภาษาไทยแทน เพื่อป้องกัน runtime error เมื่อโหลด message
export function getSafeLocale(locale?: string | null): Locale {
  if (typeof locale === 'string' && LOCALES.includes(locale as Locale)) {
    return locale as Locale;
  }

  return DEFAULT_LOCALE;
}

// Helper สำหรับจัดการ cookie ของ locale ฝั่ง browser
// ทำให้ attributes ของ cookie ถูกจัดการในที่เดียว และไม่ให้ UI สร้าง raw cookie string
// กระจายไปตาม component ต่าง ๆ
export function setLocaleCookie(locale: string) {
  const safeLocale = getSafeLocale(locale);
  const isProduction = process.env.NODE_ENV === 'production';

  const cookieParts = [
    `NEXT_LOCALE=${safeLocale}`,
    'path=/',
    `max-age=${60 * 60 * 24 * 365}`,
    'SameSite=Lax',
    ...(isProduction ? ['Secure'] : []),
    ...(process.env.NEXT_PUBLIC_COOKIE_DOMAIN
      ? [`domain=${process.env.NEXT_PUBLIC_COOKIE_DOMAIN}`]
      : []),
  ];

  document.cookie = cookieParts.join('; ');
}
