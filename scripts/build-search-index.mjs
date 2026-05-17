import fs from 'fs';

const entries = [];
for (let s = 1; s <= 114; s++) {
  const data = JSON.parse(fs.readFileSync(`public/data/surah-${s}.json`, 'utf8'));
  for (const v of data.verses) {
    const roots = [...new Set(v.words.map(w => w.root).filter(Boolean))];
    const wordRoots = v.words.map(w => w.root);
    entries.push({ id: v.id, surah: v.surah, ayah: v.ayah, name: data.name, arabic: v.arabic, roots, wordRoots });
  }
}
fs.writeFileSync('public/data/search-index.json', JSON.stringify(entries));
console.log(`Search index: ${entries.length} verses, ${(JSON.stringify(entries).length / 1024).toFixed(0)} KB`);
