#!/usr/bin/env node
// Expands plural groups so every locale carries every CLDR plural category.
//
// English is the source locale and therefore the superset: the i18n contract
// requires non-English locales to have exactly the English keys (no extras),
// while each locale must also provide every category its own CLDR plural rules
// can select. English only selects `one`/`other`, so categories a language never
// selects are filled with that locale's `other` value and are never resolved at
// runtime. Arabic selects all six, which is why the superset has to exist.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const here = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(here, '..', 'lib', 'i18n', 'locales');

function walk(value, out) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const [key, child] of Object.entries(value)) {
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      walk(child, out);
      continue;
    }
    const index = key.lastIndexOf('_');
    const category = index === -1 ? '' : key.slice(index + 1);
    if (!CATEGORIES.includes(category)) continue;
    out.push({ parent: value, base: key.slice(0, index), category });
  }
}

function groupKeys(parent, base) {
  return CATEGORIES.filter((category) => Object.hasOwn(parent, `${base}_${category}`));
}

async function expand(file) {
  const json = JSON.parse(await readFile(file, 'utf8'));
  const entries = [];
  walk(json, entries);

  const seen = new Set();
  let added = 0;
  for (const { parent, base, category } of entries) {
    const id = `${base}@${category}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const present = groupKeys(parent, base);
    if (!present.includes(category)) continue;
    const fallback = present.includes('other') ? 'other' : present[present.length - 1];
    for (const wanted of CATEGORIES) {
      const key = `${base}_${wanted}`;
      if (Object.hasOwn(parent, key)) continue;
      parent[key] = parent[`${base}_${fallback}`];
      added += 1;
    }
  }

  if (added > 0) {
    await writeFile(file, `${JSON.stringify(json, null, 2)}\n`);
  }
  return added;
}

const languages = (await readdir(localesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const language of languages) {
  for (const file of (await readdir(path.join(localesDir, language)))
    .filter((name) => name.endsWith('.json'))
    .sort()) {
    const added = await expand(path.join(localesDir, language, file));
    if (added > 0) console.log(`${language}/${file}: +${added} plural keys`);
  }
}
