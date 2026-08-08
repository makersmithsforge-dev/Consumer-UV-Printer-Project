import { useStore } from '@nanostores/react';
import { $compareSet, clearCompare, openComparisonModal } from '../stores/cupp-store.js';

export default function CompareBar({ printers }) {
  const compareSet = useStore($compareSet);
  const items = compareSet.map(id => printers.find(p => p.id === id)).filter(Boolean);

  return (
    <div className={`compare-bar${compareSet.length > 0 ? ' show' : ''}`} id="compareBar">
      <div className="compare-items" id="compareItems">
        {items.map(p => <span key={p.id} className="compare-pill">{p.name}</span>)}
      </div>
      <button type="button" id="clearCompare" onClick={clearCompare}>Clear</button>
      <button type="button" id="openCompare" style={{ background: 'var(--brand)', color: '#fff' }} onClick={openComparisonModal}>Compare selected</button>
    </div>
  );
}
