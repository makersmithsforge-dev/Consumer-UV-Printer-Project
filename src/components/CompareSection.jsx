import { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $compareSet, toggleCompare, openDetailModal } from '../stores/cupp-store.js';
import { buildMatrixHTML } from '../lib/cupp-logic.js';

export default function CompareSection({ printers }) {
  const compareSet = useStore($compareSet);
  const [comparisonView, setComparisonView] = useState('engineering');
  const matrixHtml = buildMatrixHTML(printers, comparisonView, compareSet);

  function handleMatrixClick(e) {
    const detailBtn = e.target.closest('.detail-btn');
    if (detailBtn) { openDetailModal(detailBtn.dataset.id); return; }
    const compareBtn = e.target.closest('.matrix-compare');
    if (compareBtn) { toggleCompare(compareBtn.dataset.id); }
  }

  return (
    <>
      <div className="comparison-tabs" role="tablist" aria-label="Comparison view">
        <button
          type="button"
          role="tab"
          className={comparisonView === 'engineering' ? 'active' : ''}
          aria-selected={comparisonView === 'engineering'}
          data-matrix-view="engineering"
          onClick={() => setComparisonView('engineering')}
        >Engineering Overview</button>
        <button
          type="button"
          role="tab"
          className={comparisonView === 'features' ? 'active' : ''}
          aria-selected={comparisonView === 'features'}
          data-matrix-view="features"
          onClick={() => setComparisonView('features')}
        >Feature Tiers</button>
      </div>
      <div className="comparison-meta"><strong>15 printer models · 16 tracked configurations</strong><span>Scroll horizontally to compare every configuration. Select a printer name for its full evidence record.</span></div>
      <div className="matrix-shell comparison-shell">
        <div className="table-wrap comparison-wrap">
          <table className="comparison-matrix" id="comparisonMatrix" onClick={handleMatrixClick} dangerouslySetInnerHTML={{ __html: matrixHtml }} />
        </div>
      </div>
    </>
  );
}
