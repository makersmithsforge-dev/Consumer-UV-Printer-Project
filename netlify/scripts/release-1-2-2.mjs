import { readFileSync, writeFileSync } from "node:fs";

const file = "public/index.html";
const releaseVersion = "Research Release v1.2.2";
const preservedResearchDate = "2026-08-02";

let html = readFileSync(file, "utf8");
const before = html;

// Release-label cleanup only. Do not alter research evidence dates or affiliate disclosure language.
html = html
  .replaceAll("Research Release v1.2.1", releaseVersion)
  .replaceAll("CUPP · Merged v1.1", `CUPP · ${releaseVersion}`)
  .replaceAll("V4 keeps those distinctions explicit.", "CUPP keeps those distinctions explicit.");

if (html === before) {
  throw new Error("CUPP v1.2.2 release rewrite did not change public/index.html. Check source labels before deploy.");
}

const staleMarkers = [
  "Research Release v1.2.1",
  "CUPP · Merged v1.1",
  "V4 keeps those distinctions explicit."
];

for (const marker of staleMarkers) {
  if (html.includes(marker)) {
    throw new Error(`Stale CUPP release marker remains after rewrite: ${marker}`);
  }
}

if (!html.includes(`updated ${preservedResearchDate}`) && !html.includes(`Last research pass</span></div>`)) {
  throw new Error(`Expected preserved research date ${preservedResearchDate} was not found after rewrite.`);
}

writeFileSync(file, html);
console.log(`Prepared CUPP ${releaseVersion} deploy labels while preserving research date ${preservedResearchDate}.`);
