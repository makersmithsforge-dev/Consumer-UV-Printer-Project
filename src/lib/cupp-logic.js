// Ported verbatim from public/index.html's inline <script> (CUPP v1.2.1).
// Pure/string-building functions only -- no DOM reads or writes -- so the
// same code can render on the server (Astro build) and in the browser
// (React islands), guaranteeing the printer content is present in the
// pre-rendered HTML.
//
// capLabels/tvLabel/tvClass/tierNames/JOB_SCENARIOS/inkChannelDetails are
// JS object literals in the source, not pure JSON (unquoted / single-quoted
// keys), so per the Task 1 extraction decision they stay here rather than
// in data/*.json.

export const capLabels={uv:'UV flatbed',relief:'Raised / 2.5D',uvdtf:'UV-DTF',rotary:'Rotary',openink:'Open tanks',varnish:'Varnish',fluorescent:'Fluorescent',dtg:'DTG',textiles:'Textile DTF',transfer:'Transfer film',laser:'Laser',vision:'Structured-light vision','3dupgrade':'3D upgrade path','3d':'Full-color 3D',soluble:'Soluble support',ai:'AI model generation'};
export const tvLabel={yes:'Yes',partial:'Partial',no:'No'};
export const tvClass={yes:'tv-yes',partial:'tv-partial',no:'tv-no'};
export const tierNames={flat:'Flat / rigid goods',raised:'Raised / 2.5D relief',full3d:'Full-color 3D',dtf:'UV-DTF'};
export const JOB_SCENARIOS={Low:120,Base:600,High:1800};
export const inkChannelDetails={
  'eufy-e1':'6 channels · CMYKWG',
  'longer-se':'6 channels · ink assignment not fully disclosed',
  'longer-dual':'12 channels across 2 heads · up to 6 white channels',
  'omtech-u1':'6 channels · CMYKWW',
  'omtech-pro':'7 active ink channels across 2 heads · CMYKWW + varnish',
  'xtool-single':'6 physical F1080 channels · active ink assignment not fully disclosed',
  'xtool-dual':'12 physical channels across 2 F1080 heads · active ink assignment not fully disclosed',
  'xtool-dtuv':'12 physical channels across 2 F1080 heads · dedicated UV and fabric paths',
  'xone-basic':'Not disclosed for the unverified XH-6 heads',
  'xone-standard':'Not disclosed for the unverified XH-6 heads',
  'xone-pro':'Not disclosed for the unverified XH-6 heads',
  'morpho-f1080':'6 physical F1080 channels',
  'morpho-i3200':'8 physical i3200 channels',
  'g1x-starter':'8 physical i3200 channels · active ink assignment not fully disclosed',
  'g1x-full':'8 channels · CMYK + 2 white + transparent + water-soluble support',
  'inew3d':'6 channels · CMYW + transparent + water-soluble support; no black'
};

export const statusClass=s=>s==='shipping'?'shipping':s==='promising'?'promising':'watchlist';

// Returns {total, parts:[{label,value}]} instead of a single opaque number, so every
// recommendation can show its own math -- fixing the "score without a breakdown" problem.
export const scorePrinter=(p,opts,selectedUse)=>{
  const parts=[];
  let score=0;
  let fit;
  if(p.uses.includes(selectedUse)){fit=42;} else if(selectedUse==='general'){fit=15;} else {fit=0;}
  score+=fit; parts.push({label:'Workflow fit',value:fit});
  const evid=p.confidence*5; score+=evid; parts.push({label:`Evidence confidence (${p.confidence}/5 × 5)`,value:evid});
  let budget;
  if(p.price<=opts.budget){budget=18;} else {budget=-Math.min(25,(p.price-opts.budget)/120);}
  score+=budget; parts.push({label:'Budget fit',value:Math.round(budget*10)/10});
  let stat;
  if(p.status==='shipping'){stat=16;} else if(p.status==='promising'){stat=7;} else {stat=-2;}
  score+=stat; parts.push({label:'Maturity / status',value:stat});
  if(opts.rotary){const v=p.caps.includes('rotary')?20:-45;score+=v;parts.push({label:'Rotary required',value:v});}
  if(opts.uvdtf){const v=p.caps.includes('uvdtf')?20:-45;score+=v;parts.push({label:'UV-DTF required',value:v});}
  if(opts.openInk){const v=p.openInk?18:-8;score+=v;parts.push({label:'Open-ink preference',value:v});}
  if(opts.highEvidence){const v=p.confidence>=4?18:-35;score+=v;parts.push({label:'Evidence 4+ required',value:v});}
  if(opts.priority==='evidence'){const v=p.confidence*8;score+=v;parts.push({label:'Priority: strongest evidence',value:v});}
  if(opts.priority==='price'){const v=Math.max(0,26-p.price/250);score+=v;parts.push({label:'Priority: lowest price',value:Math.round(v*10)/10});}
  if(opts.priority==='versatility'){const v=p.caps.length*4;score+=v;parts.push({label:'Priority: most capabilities',value:v});}
  return {total:score,parts};
};

export function allowedByRisk(p,risk){if(risk==='shipping') return p.status==='shipping';if(risk==='promising') return p.status!=='watchlist';return true;}

export function rankPrinters(printers,selectedUse,opts){
  const withinBudget=p=>opts.budget>=99999||p.price<=opts.budget;
  const matchesUse=p=>selectedUse==='general'||p.uses.includes(selectedUse);
  const matchesRequiredFeatures=p=>(!opts.rotary||p.caps.includes('rotary'))&&(!opts.uvdtf||p.caps.includes('uvdtf'))&&(!opts.highEvidence||p.confidence>=4);
  return printers
    .filter(p=>allowedByRisk(p,opts.risk)&&withinBudget(p)&&matchesUse(p)&&matchesRequiredFeatures(p))
    .map(p=>{const s=scorePrinter(p,opts,selectedUse);return {...p,fit:s.total,fitParts:s.parts};})
    .sort((a,b)=>b.fit-a.fit)
    .slice(0,6);
}

export function whyRowsHTML(parts){return parts.map(pt=>`<div class="why-row"><span>${pt.label}</span><b>${pt.value>0?'+':''}${pt.value}</b></div>`).join('');}

export function cardHTML(p,rank,compareSet){const selected=compareSet.includes(p.id);return `<article class="printer-card"><div class="card-top"><div><div class="maker">${p.maker}</div><div class="card-name-row"><h4>${p.name}</h4><button class="quick-compare compare-btn ${selected?'selected':''}" data-id="${p.id}" aria-pressed="${selected}">${selected?'✓ Added':'＋ Add to compare'}</button></div><span class="badge ${statusClass(p.status)}">${p.statusText}</span></div><span class="rank">${rank}</span></div><div class="price">$${p.price.toLocaleString()} <small>starting</small></div><p class="verdict">${p.best}</p><div class="chips">${p.caps.slice(0,5).map(c=>`<span class="chip">${capLabels[c]}</span>`).join('')}</div><div class="mini-grid"><div class="mini"><span>Evidence</span><b>${p.confidence} / 5</b></div><div class="mini"><span>Printhead</span><b>${p.head}</b></div></div><div class="warning"><strong>Primary concern:</strong> ${p.concern}</div><button class="why-toggle" data-why="${p.id}-${rank}">Why ranked #${rank} here? ▾</button><div class="why-box" id="why-${p.id}-${rank}"><div class="why-row" style="font-weight:900;border-bottom:2px solid var(--ink)"><span>Fit score</span><b>${Math.round(p.fit*10)/10}</b></div>${whyRowsHTML(p.fitParts)}</div><div class="card-actions"><button class="btn btn-secondary detail-btn" data-id="${p.id}">Full review</button><a class="btn btn-dark wide" href="${p.url}" target="_blank" rel="noopener sponsored">${p.affiliate?'Affiliate link · ':''}Check current price</a></div></article>`}

// ---- Cost of ownership math (shared by the detail modal mini-panel and the full #tco section) ----
export function computeTCO(p,years,scenario,includeEstimate){
  const jobsPerYear=JOB_SCENARIOS[scenario];
  const totalJobs=jobsPerYear*years;
  const purchase=p.price;
  const setup=p.tco.setup;
  const maintenance=p.tco.maint*years;
  let ink=null, inkNote=p.tco.ink.note;
  if(p.tco.ink.model==='measured'){
    const avgJobCost=(p.tco.ink.lightJobCost+p.tco.ink.heavyJobCost)/2;
    ink=avgJobCost*totalJobs;
    inkNote=`Estimated from two measured eufyMake job costs ($${p.tco.ink.lightJobCost.toFixed(2)} light-texture job / $${p.tco.ink.heavyJobCost.toFixed(2)} heavy-relief job, averaged) × ${totalJobs.toLocaleString()} jobs. Real per-job cost varies a lot by relief height and white-ink use.`;
  } else if(p.tco.ink.model==='rate'){
    ink=p.tco.ink.ratePerMl*p.tco.ink.mlPerJobDefault*totalJobs;
    inkNote=`Estimated using the disclosed $${p.tco.ink.ratePerMl}/mL rate × a rough ${p.tco.ink.mlPerJobDefault} mL/job placeholder (not benchmark-measured) × ${totalJobs.toLocaleString()} jobs. ${p.tco.ink.note}`;
  }
  let phCount=p.tco.life?Math.floor(years/p.tco.life+1e-9):0;
  let phCost=null;
  let phNote;
  if(phCount>0){
    if(includeEstimate&&p.tco.printheadEstimate){
      phCost=phCount*p.tco.printheadEstimate.value;
      phNote=`${phCount} replacement${phCount>1?'s':''} over ${years} yr included at ${p.tco.printheadEstimate.label}.`;
    } else if(p.tco.printheadEstimate){
      phNote=p.tco.printheadEstimate.official
        ? `Printhead life is modeled at ~${p.tco.life} yr, implying ${phCount} replacement${phCount>1?'s':''} over ${years} yr. The published replacement figure is ${p.tco.printheadEstimate.label}; toggle "include available printhead figure" to add it to the total.`
        : `Printhead life is claimed at ~${p.tco.life} yr, implying ${phCount} replacement${phCount>1?'s':''} over ${years} yr. Official replacement cost is not confirmed. A secondary/community figure exists (${p.tco.printheadEstimate.label}) — toggle "include available printhead figure" to add it to the total.`;
    } else {
      phNote=`Printhead life is claimed at ~${p.tco.life} yr, implying ${phCount} replacement${phCount>1?'s':''} over ${years} yr. Official replacement cost is NOT disclosed and no community estimate was found for this printer. Budget using the general industry range: $350–$1,300+.`;
    }
  } else {
    phNote=`No replacement expected within ${years} yr at the claimed ~${p.tco.life||'unknown'} yr printhead life (unverified manufacturer/community claim).`;
  }
  const knownTotal=purchase+setup+maintenance+(ink!==null?ink:0)+((includeEstimate&&phCost)?phCost:0);
  return {purchase,setup,maintenance,ink,inkNote,inkKnown:ink!==null,phCost,phNote,phCount,knownTotal,totalJobs,jobsPerYear,years,scenario};
}

export function tcoRowsHTML(t){
  const fmt=n=>n===null||n===undefined?'':'$'+Math.round(n).toLocaleString();
  return `
    <tr><td>Purchase price</td><td class="num">${fmt(t.purchase)}</td></tr>
    <tr><td>Setup / ventilation (one-time)</td><td class="num">${fmt(t.setup)}</td></tr>
    <tr><td>Annual maintenance parts × ${t.years} yr</td><td class="num">${fmt(t.maintenance)}</td></tr>
    <tr><td>Ink / resin (${t.totalJobs.toLocaleString()} jobs @ ${t.scenario.toLowerCase()} usage)<div class="table-sub">${t.inkNote}</div></td><td class="num ${t.inkKnown?'':'unknown'}">${t.inkKnown?fmt(t.ink):'Not disclosed'}</td></tr>
    <tr><td>Printhead replacement<div class="table-sub">${t.phNote}</div></td><td class="num ${t.phCost?'':'unknown'}">${t.phCost?fmt(t.phCost):(t.phCount>0?'Unknown':'—')}</td></tr>
    <tr class="total-row"><td>Known-input total (${t.years}-yr)</td><td class="num">${fmt(t.knownTotal)}</td></tr>`;
}

export function detailModalBodyHTML(p,compareSet){
  const tiersHtml=Object.keys(tierNames).map(k=>{const t=(p.tiers||{})[k];if(!t)return '';return `<div class="tier-cell"><span class="tv ${tvClass[t.v]||''}">${tierNames[k]}: ${tvLabel[t.v]||t.v}</span>${t.height?`<div>${t.height}</div>`:''}<div style="color:var(--muted)">${t.note||''}</div></div>`}).join('');
  const accHtml=(p.accessories||[]).map(a=>`<li>${a}</li>`).join('')||'<li>None disclosed.</li>';
  const calloutsHtml=(p.callouts||[]).map(c=>{const isNew=c.startsWith('NEW ');const flagged=isNew||/RESOLVED|🔴|conflict|contradict/i.test(c);return `<li class="${flagged?'flagged':''}">${isNew?'<span class="new-tag">New</span>':''}${c.replace(/^NEW [0-9-]+ ?/,'')}</li>`}).join('')||'<li>No additional callouts logged.</li>';
  const sourcesHtml=(p.sources||[]).map(s=>`<li><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('')||'<li>No sources logged yet.</li>';
  const tco3=computeTCO(p,3,'Base',false);
  return `
    <div class="verdict-box"><strong>CUPP verdict</strong><p>${p.best}</p></div>
    <div class="modal-summary-grid" aria-label="Printer specifications">
      <div class="modal-summary-row"><span>Price</span><strong>${p.priceDetail||('$'+p.price.toLocaleString())}</strong></div>
      <div class="modal-summary-row"><span>Technology</span><strong>${p.tech||'Not disclosed'}</strong></div>
      <div class="modal-summary-row"><span>Printhead</span><strong>${p.printheadDetail||p.head||'Not disclosed'}</strong></div>
      <div class="modal-summary-row"><span>Camera</span><strong>${p.camera||'Not disclosed'}</strong></div>
      <div class="modal-summary-row"><span>Bed / height sensing</span><strong>${p.bedSensor||'Not disclosed'}</strong></div>
      <div class="modal-summary-row"><span>Bed size</span><strong>${p.bedSize||p.envelope||'Not disclosed'}</strong></div>
      <div class="modal-summary-row"><span>Speed / throughput</span><strong>${p.speed||'Not disclosed'}</strong></div>
      <div class="modal-summary-row"><span>Evidence confidence</span><strong>${p.confidence}/5</strong></div>
    </div>
    <div class="detail-columns">
      <div class="detail-block"><h4>Best for</h4><p>${p.best}</p></div>
      <div class="detail-block"><h4>Avoid if</h4><p>${p.avoid}</p></div>
      <div class="detail-block"><h4>Starting price</h4><p>${p.priceDetail||('$'+p.price.toLocaleString())}${p.priceNote?` <span style="color:var(--muted)">— ${p.priceNote}</span>`:''}</p></div>
      <div class="detail-block"><h4>Working envelope</h4><p>${p.envelope}${p.bedSize?`<br><span style="color:var(--muted)">${p.bedSize}</span>`:''}</p></div>
      <div class="detail-block"><h4>Hardware</h4><p>${p.printheadDetail||p.head}${p.tech?`<br><span style="color:var(--muted)">${p.tech}</span>`:''}</p></div>
      <div class="detail-block"><h4>Ownership snapshot</h4><p>${p.ownership}</p></div>
      <div class="detail-block" style="grid-column:1/-1"><h4>Capabilities</h4><p>${p.caps.map(c=>capLabels[c]).join(' · ')}</p></div>
      <div class="detail-block" style="grid-column:1/-1"><h4>Primary unresolved concern</h4><p>${p.concern}</p></div>
    </div>
    <div class="modal-section"><h4>Capability tiers</h4><div class="tier-grid">${tiersHtml||'<div class="tier-cell">Not broken out by tier.</div>'}</div></div>
    <div class="modal-section"><h4>Accessories</h4><ul class="acc-list">${accHtml}</ul></div>
    <div class="modal-section"><h4>Full research callouts (${(p.callouts||[]).length})</h4><ul class="callout-list">${calloutsHtml}</ul></div>
    <div class="modal-section"><h4>Sources (${(p.sources||[]).length})</h4><ul class="source-list">${sourcesHtml}</ul></div>
    <div class="modal-section"><h4>Cost of ownership — 3-yr snapshot, Base usage (600 jobs/yr)</h4><div class="tco-mini"><table>${tcoRowsHTML(tco3)}</table><button class="btn btn-secondary" id="openTcoFrom" style="margin-top:10px">Open full calculator for this printer →</button></div></div>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px"><button class="btn btn-secondary compare-modal" data-id="${p.id}">${compareSet.includes(p.id)?'Remove from comparison':'Add to comparison'}</button><a class="btn btn-primary" href="${p.url}" target="_blank" rel="noopener sponsored">${p.affiliate?'Affiliate link · ':''}Check current price →</a></div>`;
}

export function inkChannels(p){return inkChannelDetails[p.id]||'Not disclosed'}

export function comparisonRow(label,picked,getValue){
  const values=picked.map(getValue);
  const normalized=values.map(v=>String(v??'Not disclosed').replace(/<[^>]*>/g,'').trim());
  const different=new Set(normalized).size>1;
  return `<tr><td><b>${label}</b></td>${values.map(v=>`<td class="${different?'difference':''}">${v??'Not disclosed'}</td>`).join('')}</tr>`;
}

export function comparisonGroup(title,picked,rows,open=false){
  return `<details class="comparison-group" ${open?'open':''}><summary>${title}</summary><div class="table-wrap"><table class="comparison-table"><thead><tr><th>Dimension</th>${picked.map(p=>`<th>${p.name}</th>`).join('')}</tr></thead><tbody>${rows.map(([label,getValue])=>comparisonRow(label,picked,getValue)).join('')}</tbody></table></div></details>`;
}

export function comparisonModalBodyHTML(picked){
  const tcos=picked.map(p=>computeTCO(p,3,'Base',false));
  const tcoById=Object.fromEntries(picked.map((p,i)=>[p.id,tcos[i]]));
  const tierValue=(p,key)=>{const t=p.tiers?.[key];return t?`${tvLabel[t.v]||t.v}${t.height?` · ${t.height}`:''}${t.note?`<div class="table-sub">${t.note}</div>`:''}`:'Not disclosed'};
  return `
    <div class="comparison-actions"><p>Cells shaded orange differ among the selected printers. Ink-channel count shows physical or disclosed active channels; duplicated channels may increase throughput, while distinct inks can add capability.</p><button class="btn btn-secondary" id="expandAllComparison" aria-expanded="false">Expand all sections</button></div>
    ${comparisonGroup('Key differences',picked,[
      ['Status',p=>`<span class="badge ${statusClass(p.status)}">${p.statusText}</span>`],
      ['Starting price',p=>p.priceDetail||('$'+p.price.toLocaleString())],
      ['Best for',p=>p.best],
      ['Printhead configuration',p=>p.printheadDetail||p.head],
      ['Ink / material channels',p=>inkChannels(p)],
      ['Speed / throughput',p=>p.speed||'Not disclosed'],
      ['Evidence',p=>`${p.confidence}/5 · ${p.confidenceNote||'No additional confidence note'}`]
    ],true)}
    <div class="channel-note"><strong>Why channels matter:</strong> A dual F1080 system can expose up to 12 physical channels versus eight on a single i3200. Manufacturers may use those channels for additional inks, dedicated workflows, or duplicate colors/white for throughput. Channel count is useful context, but it does not by itself prove faster printing or broader capability.</div>
    ${comparisonGroup('Print capabilities',picked,[
      ['Capability set',p=>p.caps.map(c=>capLabels[c]).join(', ')],
      ['Flat UV printing',p=>tierValue(p,'flat')],
      ['Raised / 2.5D relief',p=>tierValue(p,'raised')],
      ['Full-color 3D',p=>tierValue(p,'full3d')],
      ['DTF capability',p=>tierValue(p,'dtf')]
    ])}
    ${comparisonGroup('Hardware and work area',picked,[
      ['Print technology',p=>p.tech||'Not disclosed'],
      ['Working envelope',p=>p.envelope||'Not disclosed'],
      ['Bed size / clearance',p=>p.bedSize||p.envelope||'Not disclosed'],
      ['Camera / vision',p=>p.camera||'Not disclosed'],
      ['Bed / height sensing',p=>p.bedSensor||'Not disclosed']
    ])}
    ${comparisonGroup('Ownership and cost',picked,[
      ['Known-input 3-yr TCO (Base)',p=>'$'+Math.round(tcoById[p.id].knownTotal).toLocaleString()],
      ['Ink / resin cost disclosed?',p=>tcoById[p.id].inkKnown?'Yes':'No'],
      ['Printhead replacement figure',p=>p.tco.printheadEstimate?.label||'Not disclosed'],
      ['Ownership snapshot',p=>p.ownership],
      ['Primary concern',p=>p.concern]
    ])}`;
}

export function matrixTierLabel(v){return v==='yes'?'Yes':v==='no'?'No':'Partial'}
export function matrixHeader(p,compareSet){const selected=compareSet.includes(p.id);return `<div class="matrix-printer"><button type="button" class="detail-btn" data-id="${p.id}">${p.name}</button><button type="button" class="matrix-compare ${selected?'selected':''}" data-id="${p.id}" aria-pressed="${selected}">${selected?'✓ Added':'＋ Compare'}</button><span class="matrix-status ${statusClass(p.status)}">${p.statusText}</span><span class="matrix-confidence">${p.confidenceNote||('Evidence '+p.confidence+'/5')}</span></div>`}
export function matrixFeatureCell(t){return `<td><span class="tier-result ${t.v}">${matrixTierLabel(t.v)}</span>${t.height?`<b style="display:block;margin-top:8px">${t.height}</b>`:''}<p class="feature-detail">${t.note||''}</p></td>`}

export function buildMatrixHTML(printers,comparisonView,compareSet){
  const engineeringRows=[
    ['Print technology',p=>p.tech],
    ['Printhead',p=>p.printheadDetail||p.head],
    ['Camera / vision system',p=>p.camera+(p.cameraFlag?`<span class="matrix-flag">${p.cameraFlag}</span>`:'')],
    ['Bed / height sensing',p=>p.bedSensor+(p.bedSensorFlag?`<span class="matrix-flag">${p.bedSensorFlag}</span>`:'')],
    ['Bed size & clearance',p=>p.bedSize||p.envelope],
    ['Speed / throughput',p=>p.speed],
    ['Price',p=>(p.priceDetail||('$'+p.price.toLocaleString()))+(p.priceNote?`<span class="matrix-note">${p.priceNote}</span>`:'')]
  ];
  let html='<thead><tr><th class="matrix-spec">Spec</th>'+printers.map(p=>`<th>${matrixHeader(p,compareSet)}</th>`).join('')+'</tr></thead><tbody>';
  if(comparisonView==='engineering'){
    html+=engineeringRows.map(([label,getValue])=>`<tr><th class="matrix-spec" scope="row">${label}</th>${printers.map(p=>`<td>${getValue(p)||'Not disclosed'}</td>`).join('')}</tr>`).join('');
  }else{
    const rows=[['Flat UV printing','flat'],['Raised / 2.5D relief','raised'],['Full-color 3D + soluble support','full3d'],['DTF capability','dtf']];
    html+=rows.map(([label,key])=>`<tr><th class="matrix-spec" scope="row">${label}</th>${printers.map(p=>matrixFeatureCell(p.tiers[key])).join('')}</tr>`).join('');
  }
  html+='</tbody>';
  return html;
}

export function populateTcoOptionsHTML(printers){
  return printers.map(p=>`<option value="${p.id}">${p.name}</option>`).join('');
}

export function renderTcoOutputHTML(p,years,scenario,includeEstimate){
  const t=computeTCO(p,years,scenario,includeEstimate);
  let extraRow='';
  if(includeEstimate&&t.phCost){
    extraRow=`<tr class="total-row" style="border-top:1px dashed var(--line)"><td>+ available printhead figure</td><td class="num">$${Math.round(t.knownTotal).toLocaleString()}</td></tr>`;
  }
  return `
    <table class="tco-table">
      <thead><tr><th>${p.name} — ${years}-yr, ${scenario} usage (${(JOB_SCENARIOS[scenario]*years).toLocaleString()} jobs)</th><th class="num">Cost</th></tr></thead>
      <tbody>${tcoRowsHTML(t)}</tbody>
    </table>
    <p class="tco-note"><strong>Model limitations (from CUPP Master v0.9, TCO Assumptions sheet):</strong> excludes labor, electricity, taxes, financing, failure rate, and resale value. eufyMake publishes a $599 replacement module; xTool has a $399 secondary-source figure pending primary confirmation; most other brand-specific head prices remain undisclosed or non-final. A printhead figure is only added when you tick "include available printhead figure" above. ${p.tco.tcoSourceNote}</p>`;
}

export const printheadInfoBodyHTML = `
        <div class="verdict-box"><strong>User-facing takeaway</strong><p>The I3200 offers much more theoretical output capacity and is purpose-designated by Epson for UV ink. That makes it the stronger head on paper, but the complete printer—not the head alone—determines actual speed, print quality, maintenance burden, and ownership cost.</p></div>
        <p class="evidence-note"><strong>Epson's published specifications indicate substantially greater potential throughput from the I3200, but they do not prove that an I3200-equipped printer is a fixed multiple faster than an F1080-equipped printer.</strong> Comparable real-job tests are required.</p>
        <div class="table-wrap" style="max-height:none"><table class="printhead-table"><thead><tr><th>Epson specification</th><th>F1080-A1</th><th>I3200-U1</th><th>CUPP interpretation</th></tr></thead><tbody>
          <tr><td><b>Nozzles</b></td><td>1,080</td><td>3,200</td><td>I3200 has 2.96× as many nozzles.</td></tr>
          <tr><td><b>Effective print width</b></td><td>25.4 mm</td><td>33.8 mm</td><td>I3200 has a 33% wider swath.</td></tr>
          <tr><td><b>Single-size firing frequency</b></td><td>46 kHz</td><td>43.2 kHz</td><td>F1080 is slightly higher per nozzle; I3200's aggregate capacity comes from nozzle count.</td></tr>
          <tr><td><b>Multilevel firing frequency</b></td><td>11.52 kHz</td><td>21.6 kHz</td><td>I3200 is nearly 1.9× higher per nozzle in this mode.</td></tr>
          <tr><td><b>Epson ink designation</b></td><td>Aqueous</td><td>UV</td><td>Epson does not directly validate third-party UV adaptation of the aqueous-designated F1080-A1.</td></tr>
        </tbody></table></div>
        <div class="modal-section"><h4>What the capacity math means</h4><p>CUPP calculates roughly 2.8× the theoretical aggregate firing capacity in single-size operation and 5.6× in multilevel operation. Those are derived head-capacity figures—not measured printer speeds. Actual output depends on ink-channel configuration, resolution, pass count, carriage speed, curing strategy, RIP settings, and the equipment maker's implementation.</p></div>
        <div class="modal-section"><h4>Morpho manufacturer timing comparison</h4><div class="table-wrap" style="max-height:none"><table class="printhead-table"><thead><tr><th>Test shown</th><th>Morpho i3200</th><th>Morpho F1080</th><th>Other-brand F1080</th><th>Calculated i3200 advantage</th></tr></thead><tbody><tr><td><b>Full-color flat print</b></td><td>2:18</td><td>10:59</td><td>14:35</td><td>4.8× vs. Morpho F1080; 6.3× vs. other brand</td></tr><tr><td><b>1 mm raised fish print</b></td><td>13:39</td><td>—</td><td>1:10:53</td><td>5.2× vs. other brand</td></tr></tbody></table></div><p class="evidence-note"><strong>Manufacturer evidence, not an independent benchmark.</strong> Morpho produced the comparisons; the competing printer is unidentified, and the videos do not disclose resolution, pass count, quality mode, dimensions, ink-layer configuration, curing, or RIP settings. These results measure complete printer implementations—not the printhead alone.</p></div>
        <div class="modal-section"><h4>Supply-chain note — contributor knowledge, verification pending</h4><p>Michael reports that F1080 heads used in third-party equipment historically were generally not purchased from Epson as standalone printheads. Instead, suppliers purchased Epson printers containing the F1080 and removed the heads for installation in other machines. He also reports that Epson's broad sale of printheads as OEM components is comparatively recent. CUPP presents this as informed contributor knowledge—not an Epson-confirmed fact—until primary documentation or independent supply-chain corroboration is obtained.</p></div>
        <div class="modal-section"><h4>Model-name note — Epson representative attribution</h4><p>Epson representative Daniel Valles told Michael that the F1080 is also referred to as the XP600. Epson's published page uses <code>F1080-A1</code>. CUPP therefore searches both names but verifies the actual head and configuration before treating a seller's “XP600” as interchangeable.</p></div>
        <div class="modal-section"><h4>Primary sources</h4><ul class="source-list"><li><a href="https://www.epson.com.cn/products/ph/f1080-a1.html" target="_blank" rel="noopener">Epson F1080-A1 specifications</a></li><li><a href="https://www.epson.com.cn/products/ph/i3200-u1.html" target="_blank" rel="noopener">Epson I3200-U1 specifications</a></li><li><a href="https://inkjet-solution.epson.com/knowledge/documents/pdf/20220428_PrintheadI3200_4_I1600_EN.pdf" target="_blank" rel="noopener">Epson I3200/I1600 datasheet</a></li></ul></div>`;
