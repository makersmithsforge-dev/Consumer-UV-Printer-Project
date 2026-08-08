import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import { $modal, $compareSet, closeModal, toggleCompare, openTcoFor } from '../stores/cupp-store.js';
import { statusClass, detailModalBodyHTML, comparisonModalBodyHTML, printheadInfoBodyHTML } from '../lib/cupp-logic.js';

export default function DetailModal({ printers }) {
  const modal = useStore($modal);
  const compareSet = useStore($compareSet);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  const bodyRef = useRef(null);

  const open = modal !== null;

  let maker = '';
  let title = '';
  let badgesHtml = '';
  let bodyHtml = '';

  if (modal?.type === 'detail') {
    const p = printers.find(x => x.id === modal.id);
    if (p) {
      maker = p.maker;
      title = p.name;
      badgesHtml = `<span class="badge ${statusClass(p.status)}">${p.statusText}</span> <span class="badge" style="background:#eef2f1;color:#42555f">Evidence ${p.confidence}/5</span>`;
      bodyHtml = detailModalBodyHTML(p, compareSet);
    }
  } else if (modal?.type === 'comparison') {
    const picked = compareSet.map(id => printers.find(p => p.id === id)).filter(Boolean);
    maker = 'Selected comparison';
    title = `${picked.length} configurations side by side`;
    badgesHtml = '';
    bodyHtml = comparisonModalBodyHTML(picked);
  } else if (modal?.type === 'printhead') {
    maker = 'CUPP printhead research';
    title = 'Epson F1080 vs. I3200';
    badgesHtml = '<span class="badge promising">Specifications + derived capacity</span>';
    bodyHtml = printheadInfoBodyHTML;
  }

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    if (open) {
      el.scrollTop = 0;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        el.scrollTop = 0;
        closeBtnRef.current?.focus({ preventScroll: true });
      });
    } else {
      el.scrollTop = 0;
      document.body.style.overflow = '';
    }
  }, [open, modal?.type, modal?.id]);

  useEffect(() => {
    function onKeydown(e) { if (e.key === 'Escape') closeModal(); }
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, []);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  function handleBodyClick(e) {
    const compareModalBtn = e.target.closest('.compare-modal');
    if (compareModalBtn) { toggleCompare(compareModalBtn.dataset.id); return; }
    const openTcoBtn = e.target.closest('#openTcoFrom');
    if (openTcoBtn && modal?.type === 'detail') { closeModal(); openTcoFor(modal.id); return; }
    const expandBtn = e.target.closest('#expandAllComparison');
    if (expandBtn) {
      const groups = bodyRef.current ? [...bodyRef.current.querySelectorAll('.comparison-group')] : [];
      const expand = groups.some(group => !group.open);
      groups.forEach(group => { group.open = expand; });
      expandBtn.textContent = expand ? 'Collapse all sections' : 'Expand all sections';
      expandBtn.setAttribute('aria-expanded', String(expand));
    }
  }

  return (
    <div className={`detail-modal${open ? ' show' : ''}`} id="detailModal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" ref={modalRef} onClick={handleBackdropClick}>
      <div className="modal-card">
        <div className="modal-head">
          <div>
            <div className="maker" id="modalMaker">{maker}</div>
            <h3 id="modalTitle">{title}</h3>
            <div id="modalBadges" dangerouslySetInnerHTML={{ __html: badgesHtml }} />
          </div>
          <button className="icon-btn" id="closeModal" aria-label="Close" ref={closeBtnRef} onClick={closeModal}>×</button>
        </div>
        <div className="modal-body" id="modalBody" ref={bodyRef} onClick={handleBodyClick} dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </div>
    </div>
  );
}
