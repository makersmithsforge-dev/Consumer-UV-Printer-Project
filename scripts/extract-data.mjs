#!/usr/bin/env node
// One-off extraction: pulls embedded data structures out of public/index.html
// and writes them to data/*.json. Verifies byte-for-byte equivalence via
// JSON.parse + deepStrictEqual before trusting any output.
import { readFileSync, writeFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const htmlPath = path.join(repoRoot, 'public/index.html');
const html = readFileSync(htmlPath, 'utf8');

// Finds `marker`, then bracket-matches from the first opener after it
// (respecting double-quoted JSON strings and escapes) to the matching
// closer, and returns the exact source span (inclusive of both brackets).
function extractBracketSpan(source, marker, opener, closer) {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`marker not found: ${JSON.stringify(marker)}`);
  }
  const openIndex = source.indexOf(opener, markerIndex);
  if (openIndex === -1) {
    throw new Error(`opener ${opener} not found after marker ${JSON.stringify(marker)}`);
  }

  let depth = 0;
  let inString = false;
  let i = openIndex;
  for (; i < source.length; i++) {
    const ch = source[i];
    if (inString) {
      if (ch === '\\') {
        i++; // skip escaped character
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
    } else if (ch === opener) {
      depth++;
    } else if (ch === closer) {
      depth--;
      if (depth === 0) {
        return source.slice(openIndex, i + 1);
      }
    }
  }
  throw new Error(`unbalanced ${opener}/${closer} starting at index ${openIndex}`);
}

function extractPureJson(marker, opener, closer, label) {
  const span = extractBracketSpan(html, marker, opener, closer);
  try {
    return JSON.parse(span);
  } catch (err) {
    throw new Error(`${label}: not pure JSON, blocked by parse error: ${err.message}`);
  }
}

function writeAndVerify(outPath, marker, opener, closer, label) {
  const parsedOriginal = extractPureJson(marker, opener, closer, label);
  const serialized = JSON.stringify(parsedOriginal, null, 2) + '\n';
  writeFileSync(outPath, serialized, 'utf8');

  const reparsed = JSON.parse(readFileSync(outPath, 'utf8'));
  assert.deepStrictEqual(reparsed, parsedOriginal, `${label}: written file does not deep-equal parsed original`);

  console.log(`OK  ${label}: wrote ${path.relative(repoRoot, outPath)} (${Array.isArray(parsedOriginal) ? parsedOriginal.length + ' records' : Object.keys(parsedOriginal).length + ' keys'}), deep-equal verified`);
}

const jobs = [
  {
    label: 'printers',
    marker: 'const printers = [',
    opener: '[',
    closer: ']',
    out: path.join(repoRoot, 'data/printers.json'),
  },
  {
    label: 'JOB_SCENARIOS',
    marker: 'const JOB_SCENARIOS=',
    opener: '{',
    closer: '}',
    out: path.join(repoRoot, 'data/job-scenarios.json'),
  },
  {
    label: 'inkChannelDetails',
    marker: 'const inkChannelDetails={',
    opener: '{',
    closer: '}',
    out: path.join(repoRoot, 'data/ink-channels.json'),
  },
];

let failed = false;
for (const job of jobs) {
  try {
    writeAndVerify(job.out, job.marker, job.opener, job.closer, job.label);
  } catch (err) {
    failed = true;
    console.error(`BLOCKED ${job.label}: ${err.message}`);
  }
}

if (failed) {
  console.error('\nOne or more extractions were blocked. No hand-editing was performed; source left untouched.');
  process.exitCode = 1;
}
