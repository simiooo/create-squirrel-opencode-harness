import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let initialized = false;

export async function initI18n(language: string = 'en'): Promise<typeof i18next> {
  if (initialized) {
    if (i18next.language !== language) {
      await i18next.changeLanguage(language);
    }
    return i18next;
  }

  await i18next.use(Backend).init({
    lng: language,
    fallbackLng: 'en',
    backend: {
      loadPath: path.join(__dirname, '../locales/{{lng}}/{{ns}}.json')
    },
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false // Disable escaping for CLI output
    }
  });

  initialized = true;
  return i18next;
}

export function t(key: string, options?: Record<string, string | number>): string {
  return i18next.t(key, options);
}

export { i18next };
