import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextIntlClientProvider, useTranslations } from 'next-intl';

import { DEFAULT_LOCALE, getSafeLocale, setLocaleCookie } from '@/lib/i18n';
import thMessages from '@/messages/th.json';
import enMessages from '@/messages/en.json';

// ============================================================
// i18n helper tests
// ตรวจว่าระบบ locale มีความปลอดภัยเมื่อรับค่า invalid
// และสามารถ render ข้อความภาษาไทย/อังกฤษตาม locale ที่เลือกได้
// ============================================================

function LocaleText() {
  const t = useTranslations('common');
  return <span>{t('signIn')}</span>;
}

function renderLocaleText(locale: 'th' | 'en', messages: typeof thMessages | typeof enMessages) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <LocaleText />
      </NextIntlClientProvider>,
    );
  });

  return { container, root };
}

describe('getSafeLocale', () => {
  it('locale th แสดงข้อความไทย', () => {
    expect(getSafeLocale('th')).toBe('th');
  });

  it('locale en แสดงข้อความอังกฤษ', () => {
    expect(getSafeLocale('en')).toBe('en');
  });

  it('invalid locale fallback เป็น th', () => {
    expect(getSafeLocale('fr')).toBe(DEFAULT_LOCALE);
    expect(getSafeLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(getSafeLocale('')).toBe(DEFAULT_LOCALE);
  });
});

describe('rendered locale messages', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('locale th แสดงข้อความไทยจริงบนหน้า', () => {
    const { container, root } = renderLocaleText('th', thMessages);

    expect(container.textContent).toContain('เข้าสู่ระบบ');

    act(() => {
      root.unmount();
    });
  });

  it('locale en แสดงข้อความอังกฤษจริงบนหน้า', () => {
    const { container, root } = renderLocaleText('en', enMessages);

    expect(container.textContent).toContain('Sign in');

    act(() => {
      root.unmount();
    });
  });
});

describe('setLocaleCookie', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      writable: true,
      value: '',
    });
  });

  it('switch locale ปรับ cookie ได้', () => {
    setLocaleCookie('en');

    expect(document.cookie).toContain('NEXT_LOCALE=en');
    expect(document.cookie).toContain('path=/');
    expect(document.cookie).toContain('SameSite=Lax');
  });

  it('cookie สำหรับ locale invalid จะ fallback เป็น th', () => {
    setLocaleCookie('fr');

    expect(document.cookie).toContain('NEXT_LOCALE=th');
  });
});
