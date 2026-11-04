import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, type Lang, type StringKey } from './strings';

interface Ctx {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: StringKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<Ctx | null>(null);
const LANG_KEY = 'bunny-english.lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => localStorage.getItem(LANG_KEY) === 'zh' ? 'zh' : 'en');

  // Keep the interface language on this device without changing lesson progress.
  useEffect(() => {
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: StringKey, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
