import { cs } from './cs';
import { en } from './en';
import { es } from './es';
import { lt } from './lt';
import { pl } from './pl';
import { pt } from './pt';
import type { Lang, SiteText } from './types';

export const SITE: Record<Lang, SiteText> = { en, lt, es, pt, pl, cs };
export { LANGS, LANG_NAMES, type Lang, type PageName } from './types';
