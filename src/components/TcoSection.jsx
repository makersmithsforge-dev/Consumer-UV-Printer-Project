import { useEffect, useReducer, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $tcoId, $scrollToTco } from '../stores/cupp-store.js';
import { renderTcoOutputHTML } from '../lib/cupp-logic.js';

const YEARS_OPTIONS = [
  ['1', '1 year'],
  ['3', '3 years'],
  ['5', '5 years'],
];
const SCENARIO_OPTIONS = [
  ['Low', 'Low — 120 jobs/yr'],
  ['Base', 'Base — 600 jobs/yr'],
  ['High', 'High — 1,800 jobs/yr'],
];

export default function TcoSection({ printers }) {
  const storedId = useStore($tcoId);
  const scrollSignal = useStore($scrollToTco);
  const tcoId = storedId || printers[0].id;

  // years/scenario/includeEstimate are read via refs (not state) so that a
  // $tcoId change from another island (the detail modal's "open full
  // calculator" button) doesn't reset them; `bump` forces the re-render a
  // ref mutation wouldn't otherwise trigger.
  const years = useRef(3);
  const scenario = useRef('Base');
  const includeEstimate = useRef(false);
  const [, bump] = useReducer(x => x + 1, 0);

  const p = printers.find(x => x.id === tcoId) || printers[0];
  const outputHtml = renderTcoOutputHTML(p, years.current, scenario.current, includeEstimate.current);

  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    document.getElementById('tco')?.scrollIntoView({ behavior: 'smooth' });
  }, [scrollSignal]);

  return (
    <div className="tco-shell">
      <div className="tco-controls">
        <div className="field"><label htmlFor="tcoSelect">Printer / configuration</label>
          <select id="tcoSelect" value={tcoId} onChange={e => { $tcoId.set(e.target.value); }}>
            {printers.map(pr => <option key={pr.id} value={pr.id}>{pr.name}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="tcoYears">Ownership period</label>
          <select id="tcoYears" defaultValue="3" onChange={e => { years.current = +e.target.value; bump(); }}>
            {YEARS_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="tcoScenario">Annual usage</label>
          <select id="tcoScenario" defaultValue="Base" onChange={e => { scenario.current = e.target.value; bump(); }}>
            {SCENARIO_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
        <div className="field"><label className="check" style={{ marginTop: 24 }}><input id="tcoIncludeEstimate" type="checkbox" defaultChecked={false} onChange={e => { includeEstimate.current = e.target.checked; bump(); }} /> Include available printhead figure</label></div>
      </div>
      <div id="tcoOutput" dangerouslySetInnerHTML={{ __html: outputHtml }} />
    </div>
  );
}
