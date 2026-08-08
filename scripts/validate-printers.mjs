#!/usr/bin/env node
// Guards data/printers.json against structural drift (used by the weekly
// build workflow, and safe to run locally). Checks structure only -- it
// has no opinion on spec values, confidence scores, or source content.
import { readFileSync } from 'node:fs';

const path = 'data/printers.json';
let printers;

try {
  printers = JSON.parse(readFileSync(path, 'utf8'));
} catch (err) {
  console.error(`FAIL ${path}: does not parse as JSON: ${err.message}`);
  process.exit(1);
}

if (!Array.isArray(printers)) {
  console.error(`FAIL ${path}: expected a top-level array, got ${typeof printers}`);
  process.exit(1);
}

if (printers.length !== 16) {
  console.error(`FAIL ${path}: expected 16 records, found ${printers.length}`);
  process.exit(1);
}

const requiredFields = ['id', 'name', 'confidence', 'sources'];
const problems = [];
printers.forEach((p, i) => {
  for (const field of requiredFields) {
    if (p[field] === undefined || p[field] === null || p[field] === '') {
      problems.push(`record ${i} (id=${p.id ?? 'unknown'}) missing required field "${field}"`);
    }
  }
});

if (problems.length) {
  console.error(`FAIL ${path}: ${problems.length} record(s) missing required fields:`);
  problems.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

console.log(`OK ${path}: parses, 16 records, all have id/name/confidence/sources.`);
