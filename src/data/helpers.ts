// Arabic combining marks (harakat, small high marks, superscript alef) + tatweel kashida.
const DIACRITICS_RE = /[\p{M}ـ]/gu;

export const stripDiacritics = (s: string): string => s.replace(DIACRITICS_RE, "");

export const norm = (s: string): string =>
  stripDiacritics(s)
    .replace(/[إأآاٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
