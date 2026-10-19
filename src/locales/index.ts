import { en } from './en';
import { bn } from './bn';
import type { Language } from '../types';

export const translations = {
  en,
  bn,
};

/**
 * Safely resolves a nested dot-notation translation key (e.g. 'dashboard.welcomeBack')
 * with automatic fallback to English, and performs variable interpolation (e.g. {name}, {count}).
 */
export function translate(
  lang: Language,
  path: string,
  params?: Record<string, string | number>
): string {
  const currentDict = translations[lang] || translations.en;
  const fallbackDict = translations.en;

  const parts = path.split('.');
  let val: unknown = currentDict;
  for (const part of parts) {
    if (val && typeof val === 'object' && part in (val as Record<string, unknown>)) {
      val = (val as Record<string, unknown>)[part];
    } else {
      val = undefined;
      break;
    }
  }

  // Fallback to English if missing or not string
  if (val === undefined || typeof val !== 'string') {
    let fallbackVal: unknown = fallbackDict;
    for (const part of parts) {
      if (fallbackVal && typeof fallbackVal === 'object' && part in (fallbackVal as Record<string, unknown>)) {
        fallbackVal = (fallbackVal as Record<string, unknown>)[part];
      } else {
        fallbackVal = undefined;
        break;
      }
    }
    val = typeof fallbackVal === 'string' ? fallbackVal : path;
  }

  // Parameter interpolation: {name} -> 'Ekra'
  if (params && typeof val === 'string') {
    for (const [k, v] of Object.entries(params)) {
      val = (val as string).replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }

  return val as string;
}
