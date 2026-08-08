import { atom } from 'nanostores';

// Shared client-side state across the CUPP islands (finder results, compare
// matrix, TCO calculator, compare bar, detail modal) -- mirrors the module-
// level `let compareSet`/detail-modal state from the original single-script
// implementation, just addressable from multiple mounted islands.

export const $compareSet = atom([]);
export const $modal = atom(null); // null | {type:'detail', id} | {type:'comparison'} | {type:'printhead'}
export const $tcoId = atom(null);
export const $scrollToTco = atom(0); // bumped to signal "scroll #tco into view"

export function toggleCompare(id) {
  const set = $compareSet.get();
  if (set.includes(id)) {
    $compareSet.set(set.filter(x => x !== id));
  } else if (set.length < 4) {
    $compareSet.set([...set, id]);
  } else {
    alert('Compare up to four configurations at a time.');
  }
}

export function clearCompare() {
  $compareSet.set([]);
}

export function openDetailModal(id) {
  $modal.set({ type: 'detail', id });
}

export function openComparisonModal() {
  if ($compareSet.get().length < 2) {
    alert('Select at least two configurations to compare.');
    return;
  }
  $modal.set({ type: 'comparison' });
}

export function openPrintheadModal() {
  $modal.set({ type: 'printhead' });
}

export function closeModal() {
  $modal.set(null);
}

export function openTcoFor(id) {
  $tcoId.set(id);
  $scrollToTco.set($scrollToTco.get() + 1);
}
