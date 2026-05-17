import fs from 'fs';
import path from 'path';
import https from 'https';

// Buckwalter → Arabic consonant map (QAC variant)
const BW = {
  "'": 'ء', '|': 'آ', '>': 'أ', '&': 'ؤ', '<': 'إ', '}': 'ئ',
  '{': 'ا', 'A': 'ا', 'b': 'ب', 't': 'ت', 'v': 'ث', 'j': 'ج',
  'H': 'ح', 'x': 'خ', 'd': 'د', '*': 'ذ', 'r': 'ر', 'z': 'ز',
  's': 'س', '$': 'ش', 'S': 'ص', 'D': 'ض', 'T': 'ط', 'Z': 'ظ',
  'E': 'ع', 'g': 'غ', 'f': 'ف', 'q': 'ق', 'k': 'ك', 'l': 'ل',
  'm': 'م', 'n': 'ن', 'h': 'ه', 'w': 'و', 'y': 'ي',
  'Y': 'ى', 'p': 'ة', 'P': 'ة',
};

function bwToAr(s) {
  // Convert Buckwalter string to Arabic, skipping vowel markers and unknown chars
  return [...(s || '')].map(c => BW[c] ?? '').join('');
}

function rootToAr(root) {
  if (!root) return null;
  const letters = [...root].map(c => BW[c]).filter(Boolean);
  if (letters.length < 2) return null;
  return letters.join(' ');
}

function parseQAC(content) {
  // Returns Map<"surah:ayah:word", {root, lemma}>
  const map = new Map();
  for (const line of content.split('\n')) {
    if (!line || line.startsWith('#') || line.startsWith('LOCATION')) continue;
    const cols = line.split('\t');
    if (cols.length < 4) continue;
    const [loc, , , features] = cols;
    if (!features.includes('STEM')) continue;
    const m = loc.match(/\((\d+):(\d+):(\d+):/);
    if (!m) continue;
    const key = `${m[1]}:${m[2]}:${m[3]}`;
    if (map.has(key)) continue; // first STEM segment wins
    let root = null, lemma = null;
    for (const feat of features.split('|')) {
      if (feat.startsWith('ROOT:')) root = rootToAr(feat.slice(5));
      if (feat.startsWith('LEM:')) lemma = bwToAr(feat.slice(4)) || null;
    }
    map.set(key, { root, lemma });
  }
  return map;
}

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'mishkah-corpus-builder' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location));
      }
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

async function main() {
  const qacPath = process.argv[2];
  if (!qacPath) { console.error('Usage: node scripts/build-corpus.mjs <qac.txt>'); process.exit(1); }

  console.log('Parsing QAC...');
  const morphMap = parseQAC(fs.readFileSync(qacPath, 'utf8'));
  console.log(`  ${morphMap.size} word morphology entries`);

  fs.mkdirSync('public/data', { recursive: true });

  const index = [];
  for (let s = 1; s <= 114; s++) {
    process.stdout.write(`  Surah ${s}/114\r`);
    const url = `https://raw.githubusercontent.com/risan/quran-json/master/dist/chapters/en/${s}.json`;
    const data = JSON.parse(await get(url));

    const verses = data.verses.map((v, i) => {
      const ayah = i + 1;
      const arWords = v.text.split(/\s+/).filter(Boolean);
      const words = arWords.map((ar, wi) => {
        const { root = null, lemma = null } = morphMap.get(`${s}:${ayah}:${wi + 1}`) || {};
        return { ar, root, lemma: lemma || '' };
      });
      return { id: `${s}:${ayah}`, surah: s, ayah, arabic: v.text, words };
    });

    const surahData = { id: s, name: data.name, totalVerses: data.total_verses, verses };
    fs.writeFileSync(`public/data/surah-${s}.json`, JSON.stringify(surahData));
    index.push({ id: s, name: data.name, totalVerses: data.total_verses });
  }

  fs.writeFileSync('public/data/index.json', JSON.stringify(index));
  console.log('\nDone.');
}

main().catch(e => { console.error(e); process.exit(1); });
