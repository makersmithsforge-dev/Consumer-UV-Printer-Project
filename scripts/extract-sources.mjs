#!/usr/bin/env node
// One-off extraction: builds data/sources.json, a flat deduplicated list of
// every source cited across data/printers.json's per-record `sources`
// arrays. Deduplicates on the exact (name, url) pair rather than on url
// alone -- two URLs in the source data are legitimately cited under two
// different descriptions (e.g. a generic Facebook-group URL cited once per
// distinct claim within that group), and deduping by url alone would
// silently drop one of those descriptions.
import { readFileSync, writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';

const printers = JSON.parse(readFileSync('data/printers.json', 'utf8'));

const seen = new Map(); // "name|||url" -> {name, url}
let totalCitations = 0;
for (const p of printers) {
  for (const [name, url] of p.sources || []) {
    totalCitations++;
    const key = `${name}|||${url}`;
    if (!seen.has(key)) seen.set(key, { name, url });
  }
}

const sources = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));

const serialized = JSON.stringify(sources, null, 2) + '\n';
writeFileSync('data/sources.json', serialized, 'utf8');

// Verify: every (name,url) pair cited anywhere in printers.json is present
// exactly once, and nothing was fabricated or dropped.
const reparsed = JSON.parse(readFileSync('data/sources.json', 'utf8'));
assert.deepStrictEqual(reparsed, sources, 'written file does not deep-equal in-memory result');
const reparsedKeys = new Set(reparsed.map(s => `${s.name}|||${s.url}`));
assert.strictEqual(reparsedKeys.size, seen.size, 'duplicate entries in output');
for (const key of seen.keys()) {
  assert.ok(reparsedKeys.has(key), `missing source in output: ${key}`);
}

console.log(`OK data/sources.json: ${totalCitations} raw citations -> ${sources.length} unique (name,url) sources, verified.`);
