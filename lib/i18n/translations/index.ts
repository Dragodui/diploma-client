import en from './en';
import pl from './pl';
import be from './be';
import uk from './uk';
import de from './de';
import fr from './fr';
import it from './it';

export const translations = {
  en,
  pl,
  be,
  uk,
  de,
  fr,
  it,
} as const;

export type Language = keyof typeof translations;
export type Translations = typeof en;

export const languageNames: Record<Language, string> = {
  en: 'English',
  pl: 'Polski',
  be: 'Беларуская',
  uk: 'Українська',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

export const defaultLanguage: Language = 'en';
