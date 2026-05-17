export const stripDiacritics = (s: string): string =>
  s.replace(/[ً-ْٰـۖ-ۭ]/g, "");

export const norm = (s: string): string =>
  stripDiacritics(s)
    .replace(/[إأآاٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .trim();
