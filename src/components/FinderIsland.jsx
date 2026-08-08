import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $compareSet, toggleCompare, openDetailModal } from '../stores/cupp-store.js';
import { rankPrinters, cardHTML } from '../lib/cupp-logic.js';

// Verbatim from public/index.html's #useGrid buttons (icon / label / small text).
const USE_CASES = [
  { key: 'signs', icon: '▣', label: 'Signs & rigid goods', sub: 'Wood, acrylic, plaques, panels' },
  { key: 'tumblers', icon: '◉', label: 'Tumblers & cylinders', sub: 'Rotary work and curved objects' },
  { key: 'uvdtf', icon: '✦', label: 'UV-DTF decals', sub: 'Transfer graphics for irregular surfaces' },
  { key: 'cases', icon: '▤', label: 'Phone cases & gifts', sub: 'Personalized small products' },
  { key: 'textiles', icon: '▥', label: 'Textiles & apparel', sub: 'DTG or textile DTF workflow' },
  { key: 'relief', icon: '≋', label: 'Raised art & texture', sub: '2.5D relief and varnish effects' },
  { key: '3d', icon: '⬡', label: 'Full-color 3D objects', sub: 'Material jetting and soluble support' },
  { key: 'general', icon: '✚', label: 'General maker use', sub: 'Broad experimentation and flexibility' },
];

const BUDGET_OPTIONS = [
  ['2000', 'Up to $2,000'],
  ['3000', 'Up to $3,000'],
  ['5000', 'Up to $5,000'],
  ['7500', 'Up to $7,500'],
  ['99999', 'No fixed maximum'],
];
const RISK_OPTIONS = [
  ['shipping', 'Shipping products only'],
  ['promising', 'Include established preorders'],
  ['all', 'Include campaigns and watchlist'],
];
const PRIORITY_OPTIONS = [
  ['fit', 'Best workflow fit'],
  ['evidence', 'Strongest evidence'],
  ['price', 'Lowest price'],
  ['versatility', 'Most capabilities'],
];

export default function FinderIsland({ printers }) {
  const compareSet = useStore($compareSet);
  const [selectedUse, setSelectedUse] = useState('general');
  const [budget, setBudget] = useState('3000');
  const [risk, setRisk] = useState('promising');
  const [priority, setPriority] = useState('fit');
  const [needRotary, setNeedRotary] = useState(false);
  const [needUvdtf, setNeedUvdtf] = useState(false);
  const [needOpenInk, setNeedOpenInk] = useState(false);
  const [needHighEvidence, setNeedHighEvidence] = useState(false);

  const opts = {
    budget: +budget,
    risk,
    priority,
    rotary: needRotary,
    uvdtf: needUvdtf,
    openInk: needOpenInk,
    highEvidence: needHighEvidence,
  };
  const ranked = rankPrinters(printers, selectedUse, opts);

  const activeUse = USE_CASES.find(u => u.key === selectedUse);
  const useLabel = activeUse.label.toLowerCase();
  const budgetLabel = BUDGET_OPTIONS.find(([v]) => v === budget)[1];
  const priorityLabel = PRIORITY_OPTIONS.find(([v]) => v === priority)[1];

  const resultTitle = selectedUse === 'general' ? 'Recommended starting points' : `Best current matches for ${useLabel}`;
  const resultSummary = `${ranked.length} matching configuration${ranked.length === 1 ? '' : 's'} · ${budgetLabel} · ranked by ${priorityLabel.toLowerCase()}. Tap "Why ranked here" on any card to see the scoring breakdown.`;

  let resultsHtml;
  if (!ranked.length) {
    const suggestions = [];
    if (opts.budget < 99999) suggestions.push('raise the maximum budget');
    if (opts.risk !== 'all') suggestions.push('include campaigns and watchlist products');
    if (opts.rotary || opts.uvdtf || opts.highEvidence) suggestions.push('remove one of the required-feature filters');
    const suggestionText = suggestions.length ? ` Try to ${suggestions.join(', or ')}.` : '';
    resultsHtml = `<div class="empty-state"><h4>No configurations match all selected filters.</h4><p>CUPP is applying the use case, maximum budget, buying risk, and required capabilities as strict filters.${suggestionText}</p></div>`;
  } else {
    resultsHtml = ranked.map((p, i) => cardHTML(p, i + 1, compareSet)).join('');
  }

  function handleResultsClick(e) {
    const detailBtn = e.target.closest('.detail-btn');
    if (detailBtn) { openDetailModal(detailBtn.dataset.id); return; }
    const compareBtn = e.target.closest('.compare-btn');
    if (compareBtn) { toggleCompare(compareBtn.dataset.id); return; }
    const whyToggle = e.target.closest('.why-toggle');
    if (whyToggle) {
      const el = document.getElementById('why-' + whyToggle.dataset.why);
      if (el) el.classList.toggle('show');
    }
  }

  return (
    <>
      <div className="finder-shell">
        <div className="finder-step">
          <div className="step-title"><span className="step-num">1</span><h3>What do you want to make?</h3></div>
          <div className="use-grid" id="useGrid">
            {USE_CASES.map(u => (
              <button
                key={u.key}
                type="button"
                className={`use-card${u.key === selectedUse ? ' active' : ''}`}
                data-use={u.key}
                onClick={() => setSelectedUse(u.key)}
              >
                <span className="icon">{u.icon}</span><b>{u.label}</b><small>{u.sub}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="finder-step">
          <div className="step-title"><span className="step-num">2</span><h3>Set your buying constraints</h3></div>
          <div className="controls">
            <div className="field"><label htmlFor="budget">Maximum budget</label>
              <select id="budget" value={budget} onChange={e => setBudget(e.target.value)}>
                {BUDGET_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="risk">Buying risk tolerance</label>
              <select id="risk" value={risk} onChange={e => setRisk(e.target.value)}>
                {RISK_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="priority">Top priority</label>
              <select id="priority" value={priority} onChange={e => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
          </div>
          <div className="checks">
            <label className="check"><input id="needRotary" type="checkbox" checked={needRotary} onChange={e => setNeedRotary(e.target.checked)} /> Rotary required</label>
            <label className="check"><input id="needUvdtf" type="checkbox" checked={needUvdtf} onChange={e => setNeedUvdtf(e.target.checked)} /> UV-DTF required</label>
            <label className="check"><input id="needOpenInk" type="checkbox" checked={needOpenInk} onChange={e => setNeedOpenInk(e.target.checked)} /> Prefer open ink tanks</label>
            <label className="check"><input id="needHighEvidence" type="checkbox" checked={needHighEvidence} onChange={e => setNeedHighEvidence(e.target.checked)} /> Evidence confidence 4+</label>
          </div>
        </div>
        <div className="finder-actions">
          <div className="note">Prices are dated public listings or campaign offers, not guaranteed checkout prices. Affiliate compensation does not affect CUPP research or recommendations.</div>
          <button type="button" className="btn btn-primary" id="runFinder">Show matching printers</button>
        </div>
      </div>
      <div className="results-meta"><div><h3 id="resultTitle">{resultTitle}</h3><span id="resultSummary">{resultSummary}</span></div></div>
      <div className="card-grid" id="results" onClick={handleResultsClick} dangerouslySetInnerHTML={{ __html: resultsHtml }} />
    </>
  );
}
