import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { DICTS, type Lang, type StringKey } from './strings';

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  t: Translate;
  setLang: (lang: Lang) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({
  lang,
  setLang,
  children,
}: {
  lang: Lang;
  setLang: (lang: Lang) => void;
  children: ReactNode;
}) {
  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang];
    const t: Translate = (key, vars) => {
      let out: string = dict[key] ?? key;
      if (vars) {
        for (const [name, v] of Object.entries(vars)) {
          out = out.replaceAll(`{${name}}`, String(v));
        }
      }
      return out;
    };
    return { lang, t, setLang };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
