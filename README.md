# CUPP — Consumer UV Printer Project

An evidence-first comparison of consumer UV printers, published at
[cupp.makersmithsforge.com](https://cupp.makersmithsforge.com) by
[Makersmiths Forge](https://www.makersmithsforge.com/).

CUPP tracks specs, pricing, ownership cost, and sourced evidence for
consumer/prosumer UV printers — a guided finder, a full engineering
comparison matrix, and a cost-of-ownership calculator, all backed by cited
sources with confidence ratings instead of one-line verdicts.

## Stack

Built with [Astro](https://astro.build) so the page ships pre-rendered
static HTML (for SEO and load speed); the interactive pieces (finder,
comparison matrix, TCO calculator, compare tray, detail modals) are React
islands (`client:load`) that hydrate on top, sharing state via
[nanostores](https://github.com/nanostores/nanostores).

- `src/pages/index.astro` — the page shell: static header/hero/evidence
  sections plus the mounted islands.
- `src/components/` — the React islands.
- `src/lib/cupp-logic.js` — scoring, TCO math, and HTML-string builders
  shared between server rendering and client interactivity.
- `src/stores/cupp-store.js` — cross-island state (compare set, open modal,
  TCO selection).
- `data/printers.json` — the 16 tracked printer configurations. Extracted
  from the original single-file page via `scripts/extract-data.mjs`, with
  a `deepStrictEqual` check against the original parse to guarantee
  byte-for-byte fidelity. Every spec value, confidence score, and source
  URL here is sourced research — do not hand-edit without updating the
  evidence behind it.
- `data/site-meta.json` — small site-level fields (currently just the
  displayed research-release version) read by the template.
- `data/evidence.json`, `data/sources.json`, `data/owned-products.json` —
  placeholders for future data extraction work.

## Development

```shell
npm install
npm run dev       # local dev server
npm run build     # static build to dist/
npm run preview   # serve the built dist/ locally
```

## Deployment

Netlify builds this repo (`npm run build`, publishing `dist`) and creates a
deploy preview for every pull request. Production deploys from `main` are
approved manually — do not push directly to `main`; open a PR and let the
preview build before merging.

## Data discipline

This project's value is its evidence discipline. Spec values, confidence
scores, source URLs, and the affiliate disclosure text should never change
as a side effect of a structural or tooling change — only through
deliberate research updates.
