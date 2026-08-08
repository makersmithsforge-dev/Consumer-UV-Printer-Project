import { openPrintheadModal } from '../stores/cupp-store.js';

export default function PrintheadInfoButton() {
  return (
    <button className="btn btn-dark" id="openPrintheadInfo" type="button" onClick={openPrintheadModal}>
      Printhead information: F1080 vs. I3200
    </button>
  );
}
