// app.js
import {
  fetchAndFilterAddresses,
  geocodeAddress,
  queryZoneCode,
  queryHeritage,
  queryBushfire,
  queryForeshore,
  queryBiodiversity,
  queryBoundary
} from "/static/js/APIQuery.js";


document.addEventListener("DOMContentLoaded", init);

// ----- DOM -----
var devSelect, shedFields, patioFields, lotSizeField;
var submitBtn, resetBtn, resultPre, downloadPdfBtn

// ======== INIT ========
function init() {
  devSelect = document.getElementById("development");
  shedFields = document.getElementById("shed-fields");
  patioFields = document.getElementById("patio-fields");
  const landSizeInput = document.getElementById("land_size");
  lotSizeField = landSizeInput ? landSizeInput.closest(".field") : null;
  submitBtn = document.getElementById("submit");
  resetBtn = document.getElementById("reset");
  resultPre = document.getElementById("result");
  downloadPdfBtn = document.getElementById("download-pdf");
  
  // Wire events
  devSelect.addEventListener("change", applyDevVisibility);
  submitBtn.addEventListener("click", handleSubmit);
  resetBtn.addEventListener("click", resetForm);
  downloadPdfBtn.addEventListener("click", exportPdf);

  // start hidden
  hide(shedFields);
  hide(patioFields);

  // wire conditional rules once (they re-check themselves on change/input)
  setupMetalReflective(shedFields);
  setupMetalReflective(patioFields);

  setupBushfireDistance(shedFields);
  setupBushfireDistance(patioFields);

  setupDistanceNonCombustible(shedFields);
  setupDistanceNonCombustible(patioFields);

  setupAdjacentInterfere(shedFields);
  setupAdjacentInterfere(patioFields); // safe if fields missing

  // replacement-only patio questions + overlap handling
  setupStructureTypeReplacement(patioFields);

  // roof-driven fields
  setupRoofOverhang(shedFields);
  setupRoofOverhang(patioFields);
  setupRoofAttached(patioFields);
  setupRoofRoof_Height(patioFields);
  setupRoofFascia_Connection(patioFields);

  // roof === "yes" -> show stormwater
  //setupRoofStormwater(shedFields);
  setupRoofStormwater(patioFields);

  // attached === "yes" -> show above_gutter
  setupAttachedAboveGutter(patioFields);

  // fascia_connection === "yes" -> show engineer_spec
  setupFasciaEngineerSpec(patioFields);

  // first pass
  applyDevVisibility();
  recheckAll(shedFields);
  recheckAll(patioFields);
}

// ======== VISIBILITY HELPERS ========
function show(el) { if (el) el.classList.remove("hidden"); }
function hide(el) { if (el) el.classList.add("hidden"); }
function isHidden(el) { return el ? el.classList.contains("hidden") : true; }
function fieldOf(el) { return el ? el.closest(".field") : null; }

// Re-run all rules for a section (handy after toggling dev type)
function recheckAll(section) {
  if (!section) return;
  var metal = section.querySelector("#metal");
  if (metal) metal.dispatchEvent(new Event("change"));
  document.getElementById("bushfire")?.dispatchEvent(new Event("change"));
  var dist = section.querySelector("#distance_dwelling");
  if (dist) {
    dist.dispatchEvent(new Event("input"));
    dist.dispatchEvent(new Event("change"));
  }
  var adj = section.querySelector("#adjacent_building");
  if (adj) adj.dispatchEvent(new Event("change"));

  // ensure replacement-only logic re-runs
  var stype = section.querySelector("#structure_type");
  if (stype) stype.dispatchEvent(new Event("change"));

  // re-triggers for roof conditionals
  var roof = section.querySelector("#roof");
  if (roof) roof.dispatchEvent(new Event("change"));
  var attached = section.querySelector("#attached");
  if (attached) attached.dispatchEvent(new Event("change"));
  var fascia = section.querySelector("#fascia_connection");
  if (fascia) fascia.dispatchEvent(new Event("change"));
}

// ======== RULES ========
// 1) metal === "yes" -> show reflective
function setupMetalReflective(section) {
  if (!section) return;
  var metal = section.querySelector("#metal");
  var reflective = section.querySelector("#reflective");
  var reflectiveField = fieldOf(reflective);
  if (!metal || !reflectiveField) return;

  function update() {
    var v = (metal.value || "").toLowerCase();
    if (v === "yes") {
      show(reflectiveField);
    } else {
      hide(reflectiveField);
      if (reflective) reflective.value = "";
    }
  }
  metal.addEventListener("change", update);
  update();
}

// 2) bushfire === "yes" -> show distance_dwelling
function setupBushfireDistance(section) {
  if (!section) return;
   
  var bush = document.getElementById("bushfire");
  var dist = section.querySelector("#distance_dwelling");
  var distField = fieldOf(dist);
  if (!bush || !distField) return;

  function update() {
    var v = (bush.value || "").toLowerCase();
    if (v === "yes") {
      show(distField);
    } else {
      hide(distField);
      if (dist) dist.value = "";
    }
    updateDistanceNonCombustible(section);
  }
  bush.addEventListener("change", update);
  update();
}

// 3) distance_dwelling < 5 -> show non_combustible
function setupDistanceNonCombustible(section) {
  if (!section) return;
  var dist = section.querySelector("#distance_dwelling");
  var nonc = section.querySelector("#non_combustible");
  var noncField = fieldOf(nonc);
  if (!dist || !noncField) return;

  function onDistChange() { updateDistanceNonCombustible(section); }
  dist.addEventListener("input", onDistChange);
  dist.addEventListener("change", onDistChange);
  updateDistanceNonCombustible(section);
}
function updateDistanceNonCombustible(section) {
  var dist = section.querySelector("#distance_dwelling");
  var nonc = section.querySelector("#non_combustible");
  var noncField = fieldOf(nonc);
  if (!dist || !noncField) return;

  var distField = fieldOf(dist);
  var hidden = isHidden(distField);
  var valNum = parseFloat(dist.value);
  var showIt = !hidden && isFinite(valNum) && valNum < 5;

  if (showIt) {
    show(noncField);
  } else {
    hide(noncField);
    if (nonc) nonc.value = "";
  }
}

// 4) adjacent_building === "yes" -> show interfere
function setupAdjacentInterfere(section) {
  if (!section) return;
  var adj = section.querySelector("#adjacent_building");
  var intr = section.querySelector("#interfere");
  if (!adj || !intr) return; // Patio might not have these
  var intrField = fieldOf(intr);
  if (!intrField) return;

  function update() {
    var v = (adj.value || "").toLowerCase();
    if (v === "yes") {
      show(intrField);
    } else {
      hide(intrField);
      intr.value = "";
    }
  }
  adj.addEventListener("change", update);
  update();
}

// 5) structure_type === "replacement" -> show deck questions & hide overlaps
function setupStructureTypeReplacement(section) {
  if (!section) return;
  var type = section.querySelector("#structure_type");
  if (!type) return;

  // "Replacement" only fields
  var hExisting= section.querySelector("#height_existing");
  var matQual  = section.querySelector("#material_quality");
  var sameSize = section.querySelector("#same_size");

  // Bail if the replacement trio doesn’t exist (means this isn’t the patio section)
  if (!hExisting || !matQual || !sameSize) return;

  var hExistingField= fieldOf(hExisting);
  var matQualField  = fieldOf(matQual);
  var sameSizeField = fieldOf(sameSize);

  function clear(el) { if (el) el.value = ""; }
  function showIf(f)  { if (f) show(f); }
  function hideIf(f)  { if (f) hide(f); }

  function update() {
    var isReplacement = (type.value || "").toLowerCase() === "replacement";

    if (isReplacement) {
      // show ALL three
      showIf(hExistingField);
      showIf(matQualField);
      showIf(sameSizeField);
    } else {
      // hide & clear ALL three
      hideIf(hExistingField); clear(hExisting);
      hideIf(matQualField);   clear(matQual);
      hideIf(sameSizeField);  clear(sameSize);
    }
  }

  type.addEventListener("change", update);
  update();
}


// 6) roof === "yes" -> show overhang / roof-dependent fields
function setupRoofOverhang(section) {
  if (!section) return;
  var roof = section.querySelector("#roof");
  var overhang = section.querySelector("#overhang");
  var overhangField = fieldOf(overhang);
  if (!roof || !overhangField) return;

  function update() {
    var v = (roof.value || "").toLowerCase();
    if (v === "yes") {
      show(overhangField);
    } else {
      hide(overhangField);
      if (overhang) overhang.value = "";
      hideFieldAndClear(section, "#attached");
      hideFieldAndClear(section, "#roof_height");
      hideFieldAndClear(section, "#fascia_connection");
      hideFieldAndClear(section, "#stormwater");
      hideFieldAndClear(section, "#above_gutter");
      hideFieldAndClear(section, "#engineer_spec");
    }
  }
  roof.addEventListener("change", update);
  update();
}

// 6) roof === "yes" -> show attached
function setupRoofAttached(section) {
  if (!section) return;
  var roof = section.querySelector("#roof");
  var roofattached = section.querySelector("#attached");
  var roofattachedField = fieldOf(roofattached);
  if (!roof || !roofattachedField) return;

  function update() {
    var v = (roof.value || "").toLowerCase();
    if (v === "yes") {
      show(roofattachedField);
    } else {
      hide(roofattachedField);
      if (roofattached) roofattached.value = "";
    }
  }
  roof.addEventListener("change", update);
  update();
}

// 6) roof === "yes" -> show Roof_Height
function setupRoofRoof_Height(section) {
  if (!section) return;
  var roof = section.querySelector("#roof");
  var roof_height = section.querySelector("#roof_height");
  var roof_heightField = fieldOf(roof_height);
  if (!roof || !roof_heightField) return;

  function update() {
    var v = (roof.value || "").toLowerCase();
    if (v === "yes") {
      show(roof_heightField);
    } else {
      hide(roof_heightField);
      if (roof_height) roof_height.value = "";
    }
  }
  roof.addEventListener("change", update);
  update();
}


// 6) roof === "yes" -> show fascia_connection
function setupRoofFascia_Connection(section) {
  if (!section) return;
  var roof = section.querySelector("#roof");
  var fascia_connection = section.querySelector("#fascia_connection");
  var fascia_connectionField = fieldOf(fascia_connection);
  if (!roof || !fascia_connectionField) return;

  function update() {
    var v = (roof.value || "").toLowerCase();
    if (v === "yes") {
      show(fascia_connectionField);
    } else {
      hide(fascia_connectionField);
      if (fascia_connection) fascia_connection.value = "";
    }
  }
  roof.addEventListener("change", update);
  update();
}


// roof === "yes" -> show stormwater
function setupRoofStormwater(section) {
  if (!section) return;
  var roof = section.querySelector("#roof");
  var storm = section.querySelector("#stormwater");
  var stormField = fieldOf(storm);
  if (!roof || !stormField) return;

  function update() {
    var v = (roof.value || "").toLowerCase();
    if (v === "yes") {
      show(stormField);
    } else {
      hide(stormField);
      if (storm) storm.value = "";
    }
  }
  roof.addEventListener("change", update);
  update();
}

// attached === "yes" -> show above_gutter
function setupAttachedAboveGutter(section) {
  if (!section) return;
  var attached = section.querySelector("#attached");
  var above = section.querySelector("#above_gutter");
  var aboveField = fieldOf(above);
  if (!attached || !aboveField) return;

  function update() {
    var v = (attached.value || "").toLowerCase();
    if (v === "yes") {
      show(aboveField);
    } else {
      hide(aboveField);
      if (above) above.value = "";
    }
  }
  attached.addEventListener("change", update);
  update();
}

// fascia_connection === "yes" -> show engineer_spec
function setupFasciaEngineerSpec(section) {
  if (!section) return;
  var fascia = section.querySelector("#fascia_connection");
  var eng = section.querySelector("#engineer_spec");
  var engField = fieldOf(eng);
  if (!fascia || !engField) return;

  function update() {
    var v = (fascia.value || "").toLowerCase();
    if (v === "yes") {
      show(engField);
    } else {
      hide(engField);
      if (eng) eng.value = "";
    }
  }
  fascia.addEventListener("change", update);
  update();
}

// ======== DEV TYPE TOGGLE ========
function applyDevVisibility() {
  hide(shedFields);
  hide(patioFields);

  if (devSelect.value === "shed") {
    show(shedFields);
    recheckAll(shedFields);
  } else if (devSelect.value === "patio") {
    show(patioFields);
    recheckAll(patioFields);
  }
}

// ======== REQUIRED CHECKS (non-empty) ========
function labelFor(el) {
  const lbl = document.querySelector("label[for='" + el.id + "']");
  return (lbl ? lbl.textContent.trim() : (el.getAttribute("placeholder") || el.id || "Field"));
}
// Single-message validation: ignore hidden/disabled, stop at first empty
function validateRequired() {
  // clear any previous highlight
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

  // find all inputs/selects/textareas that are inside a .field
  const nodes = document.querySelectorAll(
    ".field input, .field select, .field textarea"
  );

  for (const el of nodes) {
    // skip anything not relevant
    if (el.disabled) continue;                 // programmatically disabled
    if (el.closest('.hidden')) continue;       // any hidden ancestor (e.g., whole section hidden)

    // compute "empty"
    const tag  = el.tagName;
    const type = (el.getAttribute('type') || '').toLowerCase();
    let empty  = false;

    if (tag === 'SELECT') {
      empty = (el.value === '');                                 // "-- Select --"
    } else if (type === 'number') {
      empty = (el.value === '' || isNaN(Number(el.value)));       // blank or NaN
    } else {
      empty = (String(el.value || '').trim() === '');
    }

    if (empty) {
      // highlight & focus first missing only
      el.classList.add('is-invalid');
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.focus({ preventScroll: true });
      alert("Please complete all required fields before submitting.");
      return false;
    }
  }

  return true; // everything visible & enabled is filled
}

// TESTING: make the POST hit the debug sleep. 0 = no sleep, 40 = 40s sleep
const DEBUG_SLEEP_SECS = 0; // change to 0 after testing

// ====== TIMEOUT HELPER ======
const REQUEST_TIMEOUT_MS = 15000; // 15s overall timeout

function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal })
    .finally(() => clearTimeout(id));
}

// ======== SUBMIT ========
function handleSubmit(e) {
  if (e && e.preventDefault) e.preventDefault(); // just in case it's a real <form>
  if (!validateRequired()) return;               // <-- block submit until all visible fields filled
  var dev = devSelect.value;                     // safe now

  var payload = {
    
    address: document.getElementById("address").value,
    longitude: window.latestCoords ? window.latestCoords.x : undefined,
    latitude: window.latestCoords ? window.latestCoords.y : undefined,
    development: dev,
    zoning: document.getElementById("zoning").value,
    heritage: document.getElementById("heritage").value,
    foreshore: document.getElementById("foreshore").value,
    bushfire: valFrom(document, "#bushfire"),
    land_size: numFrom(document, "#land_size"),
    sensitive_area: document.getElementById("sensitive_area").value


  };
  
  // Shed-only fields
  if (dev === "shed") {
    var r = shedFields;
    payload.area = numFrom(r, "#area");
    payload.height = numFrom(r, "#height");
    payload.boundary_distance = numFrom(r, "#boundary_distance");
    payload.building_line = valFrom(r, "#building_line");
    payload.shipping_container = valFrom(r, "#shipping_container");
    payload.stormwater = valFrom(r, "#stormwater"); // now conditional via roof
    payload.metal = valFrom(r, "#metal");
    payload.reflective = valFrom(r, "#reflective");
    payload.distance_dwelling = numFrom(r, "#distance_dwelling");
    payload.non_combustible = valFrom(r, "#non_combustible");
    payload.adjacent_building = valFrom(r, "#adjacent_building");
    payload.interfere = valFrom(r, "#interfere");
    payload.habitable = valFrom(r, "#habitable");
    payload.easement = valFrom(r, "#easement");
    payload.services = valFrom(r, "#services");
    payload.existing_structures = valFrom(r, "#existing_structures");
    
  }

  // Patio-only fields
  if (dev === "patio") {
    var p = patioFields;
    payload.structure_type = valFrom(p, "#structure_type");
    payload.area = numFrom(p, "#area");
    payload.total_structures_area = numFrom(p, "#total_structures_area");
    payload.wall_height = valFrom(p, "#wall_height");
    payload.behind_building_line = valFrom(p, "#behind_building_line");
    payload.boundary_distance = numFrom(p, "#boundary_distance");
    payload.metal = valFrom(p, "#metal");
    payload.reflective = valFrom(p, "#reflective");
    payload.floor_height = numFrom(p, "#floor_height");
    payload.roof = valFrom(p, "#roof");
    payload.drainage = valFrom(p, "#drainage");
    payload.distance_dwelling = numFrom(p, "#distance_dwelling");
    payload.non_combustible = valFrom(p, "#non_combustible");

    // replacement-only patio answers
    payload.height_existing = numFrom(p, "#height_existing");
    payload.material_quality = valFrom(p, "#material_quality");
    payload.same_size = valFrom(p, "#same_size");


    // roof-driven fields
    payload.overhang = numFrom(p, "#overhang");
    payload.attached = valFrom(p, "#attached");
    payload.above_gutter = valFrom(p, "#above_gutter");
    payload.roof_height = numFrom(p, "#roof_height");
    payload.fascia_connection = valFrom(p, "#fascia_connection");
    payload.engineer_spec = valFrom(p, "#engineer_spec");
    payload.stormwater = valFrom(p, "#stormwater"); // now conditional via roof
  }

    fetchWithTimeout("/get-assessment-result/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
    })
    .then(function (res){ 
      if (res.status === 429) {
        var retry = res.headers.get("Retry-After");      // seconds (string)
        return res.json().catch(() => ({})).then(function (data) {
          var msg = (data && data.message) ? data.message : "Too many requests.";
          resultPre.textContent = retry
            ? msg + " Try again in ~" + retry + " seconds."
            : msg;
          showDownloadIfReady();
          throw new Error("rate_limited");
    });
    }
    if (!res.ok) {
      return res.text().then(function (body) {
        throw new Error(`server_error ${res.status}: ${body.slice(0,200)}...`);
      });
  }
      return res.text(); })
    .then(function (raw) {
  
  
        // Beautify the server response (bullets + clickable links)
        const assessmentHtml = formatAssessmentHtml(raw);

        const reasonsHtml = '<div id="rejection-reasons">'
            + prettifyLinks(assessmentHtml, { mode: "label", label: "SEPP", force: true }) 
            + '</div>';        
        
        // Collect the answers that the user actually filled in
        const answers = collectAnswers();
        const answersHtml = answersListHtml(answers);

        // Build two views:
        // - on-screen: just the assessment result
        // - pdf-only: header + assessment result (hidden on screen, shown only for print/export)
        const reportHtml = `
          <div id="report">
            <!-- On-screen only -->
            <div class="on-screen-only">
              <h2 class="report-title">Assessment Result</h2>
              ${reasonsHtml}
            </div>

            <!-- PDF only (explicit pages) -->
            <div class="pdf-only">
              <!-- PDF PAGE 1 -->
              <section class="pdf-page" id="pdf-page-1">
                <div class="pdf-banner">
                  <h1>Exempt Development Assessment</h1>
                  <p class="subtitle">Sheds &amp; Patios — Albury City</p>
                  <p class="lead">Check if a shed or patio qualifies as exempt development and can be built without council approval.</p>
                </div>
                
                <div class="pdf-body">
                  <h2 class="report-title">Assessment Result</h2>
                  ${reasonsHtml}
                </div>
              </section>

              <!-- PDF PAGE 2 (summary) -->
              <section class="pdf-page" id="pdf-page-2">
                <div class="pdf-banner">
                  <h1>Exempt Development Assessment</h1>
                  <p class="subtitle">Sheds &amp; Patios — Albury City</p>
                  <p class="lead">Check if a shed or patio qualifies as exempt development and can be built without council approval.</p>
                </div>              
              
                <div class="pdf-body">
                  <h2 class="report-title">Assessment Summary</h2>
                  ${answersHtml}
                </div>
              </section>
            </div>
          </div>
        `;
        resultPre.innerHTML = reportHtml.trim();
        showDownloadIfReady();
    })
    .catch(function (err) {
      if (err && err.name === "AbortError") {
      resultPre.textContent = "This is taking longer than expected. Please try again.";
      showDownloadIfReady();
      return;
    }
      if (err && err.message === "rate_limited") return; 
      console.error(err);
      resultPre.textContent = "An error occurred while submitting. Please try again.";
      showDownloadIfReady();
    });

}

// ======== SIMPLE READ HELPERS ========
function valFrom(root, selector) {
  var el = root.querySelector(selector);
  return el ? (el.value ?? "") : "";
}
function numFrom(root, selector) {
  var el = root.querySelector(selector);
  var n = parseFloat(el ? el.value : "");
  return isFinite(n) ? n : null;
}

// --- Helpers to build a clean "Answers" list for the PDF ---
function escapeHtml(s) {
  return String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;')
    .replaceAll("'", '&#39;');
}

// Return array of { label, value } for all visible, answered fields
function collectAnswers() {
  const items = [];
  // address first (it sits outside .field grid in your markup)
  const addrEl = document.getElementById('address');
  const addrVal = (addrEl?.value || '').trim();
  if (addrVal) items.push({ label: 'Property address', value: addrVal });

  // find all inputs/selects inside a .field that are visible and have a value
  document.querySelectorAll(".field input, .field select, .field textarea").forEach(el => {
    if (el.disabled) return;
    if (el.closest('.hidden')) return;

    // compute value
    let val = '';
    const tag = el.tagName;
    const type = (el.getAttribute('type') || '').toLowerCase();

    if (tag === 'SELECT') {
      if (el.value === '') return; // ignore placeholder
      const opt = el.options[el.selectedIndex];
      val = (opt && opt.text) ? opt.text.trim() : el.value.trim();
    } else if (type === 'number') {
      if (el.value === '' || isNaN(Number(el.value))) return;
      val = el.value.trim();
    } else {
      val = (el.value || '').trim();
      if (!val) return;
    }

    // label
    const lbl = labelFor(el);
    if (!lbl) return;

    items.push({ label: lbl, value: val });
  });

  return items;
}

// Renders the answers into a clean <ul>
function answersListHtml(items) {
  if (!items.length) return '<p>(No answers)</p>';
  return `
    <ul class="kv">
      ${items.map(({label, value}) =>
        `<li><span class="k">${escapeHtml(label)}:</span> <span class="v">${escapeHtml(value)}</span></li>`
      ).join('')}
    </ul>`;
}

// ======== SUMMARY + PDF ========

function showDownloadIfReady() {
  // Consider both textContent and innerHTML, then trim
  const hasContent = ((resultPre.textContent || resultPre.innerHTML) || "").trim().length > 0;

  const toggle = (el, show) => {
    if (!el) return;
    el.classList[show ? 'remove' : 'add']('hidden');
  };

  toggle(downloadPdfBtn, hasContent);
}

// Wait until DOM has painted, webfonts loaded, and images (in container) are ready
async function waitForRender(container) {
  // let layout/paint finish
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

  // wait for webfonts (if any)
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch (_) {}
  }

  // wait for images inside the target container
  const imgs = Array.from(container.querySelectorAll('img')).filter(img => !img.complete);
  if (imgs.length) {
    await Promise.all(imgs.map(img => new Promise(res => {
      img.onload = res; img.onerror = res;
    })));
  }
}

// function exportPdf() {
// async function exportPdf() {
//   const { jsPDF } = window.jspdf;

//   const result = document.getElementById('result');
//   if (!result) {
//     alert('No result to export yet.');
//     return;
//   }

//   // --- 1) Build an off-screen sandbox with a cloned #result ---
//   const sandbox = document.createElement('div');
//   // Acts as the scope for your .export-only CSS rules
//   sandbox.className = 'export-only';
//   // Keep it completely off-screen & invisible (but still renderable)
//   sandbox.style.cssText = [
//     'position:fixed',
//     'left:-200vw',     // far off the viewport
//     'top:0',
//     'width:100vw',
//     'background:#fff',
//     'pointer-events:none',
//     'opacity:0',
//     'z-index:-1',
//   ].join(';');

//   // Deep clone of the result subtree
//   const clone = result.cloneNode(true);
//   sandbox.appendChild(clone);
//   document.body.appendChild(sandbox);

//   // Helper to let the browser layout/paint the sandbox before capture
//   const waitNextFrame = () => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
//   await waitNextFrame();

//   // Inside the sandbox, prefer explicit pages; else capture the whole clone
//   const root = sandbox.querySelector('#result') || sandbox;
//   const pageNodes = Array.from(root.querySelectorAll('.pdf-only .pdf-page'));
//   const targets = pageNodes.length ? pageNodes : [root];

//   // --- 2) Setup jsPDF and margin-aware slicer ---
//   const pdf = new jsPDF('p', 'mm', 'a4');
//   const pdfW = pdf.internal.pageSize.getWidth();
//   const pdfH = pdf.internal.pageSize.getHeight();

//   // Margins (mm)
//   const MARGIN_T = 12, MARGIN_R = 12, MARGIN_B = 16, MARGIN_L = 12;

//   function addCanvasAsPages(canvas, isFirstPage) {
//     const usableW = pdfW - (MARGIN_L + MARGIN_R);
//     const scale   = usableW / canvas.width;
//     const usableH = pdfH - (MARGIN_T + MARGIN_B);
//     const scaledH = canvas.height * scale;

//     if (scaledH <= usableH) {
//       if (!isFirstPage) pdf.addPage();
//       pdf.addImage(canvas.toDataURL('image/jpeg', 1.0), 'JPEG',
//                    MARGIN_L, MARGIN_T, usableW, scaledH);
//       return;
//     }

//     // Slice tall content in canvas pixels so each slice fits usableH
//     const sliceHpx = Math.floor(usableH / scale);
//     let y = 0, pageIndex = 0;

//     while (y < canvas.height) {
//       const h = Math.min(sliceHpx, canvas.height - y);

//       const slice = document.createElement('canvas');
//       slice.width = canvas.width;
//       slice.height = h;
//       slice.getContext('2d').drawImage(
//         canvas,
//         0, y, canvas.width, h,
//         0, 0, canvas.width, h
//       );

//       if (!(isFirstPage && pageIndex === 0)) pdf.addPage();
//       pdf.addImage(slice.toDataURL('image/jpeg', 1.0), 'JPEG',
//                    MARGIN_L, MARGIN_T, usableW, h * scale);

//       y += h;
//       pageIndex++;
//     }
//   }

//   try {
//     // --- 3) Render each target in the sandbox without touching the live page ---
//     let first = true;
//     for (const el of targets) {
//       const canvas = await html2canvas(el, {
//         scale: 2,
//         useCORS: true,
//         allowTaint: true,
//         // Use the element’s own width to avoid global layout influence
//         windowWidth: el.scrollWidth || document.documentElement.clientWidth
//       });
//       addCanvasAsPages(canvas, first);
//       first = false;
//     }

//     // Optional footer
//     const total = pdf.getNumberOfPages();
//     for (let i = 1; i <= total; i++) {
//       pdf.setPage(i);
//       const w = pdf.internal.pageSize.getWidth();
//       const h = pdf.internal.pageSize.getHeight();
//       pdf.setFont('helvetica', 'normal');
//       pdf.setFontSize(9);
//       pdf.setTextColor(120);
//       pdf.setDrawColor(200);
//       pdf.setLineWidth(0.2);
//       pdf.line(MARGIN_L, h - 12, w - MARGIN_R, h - 12);
//       pdf.text('© Albury City · Exempt Development Checker', MARGIN_L, h - 6);
//       pdf.text(`Page ${i} of ${total}`, w - MARGIN_R, h - 6, { align: 'right' });
//     }

//     pdf.save('assessment-result.pdf');
//   } catch (err) {
//     console.error(err);
//     alert('Sorry—there was a problem generating the PDF.');
//   } finally {
//     // --- 4) Always remove the sandbox so nothing leaks to the DOM ---
//     sandbox.remove();
//   }
// }
// async function exportPdf() {
//   const { jsPDF } = window.jspdf;

//   const result = document.getElementById('result');
//   if (!result) {
//     alert('No result to export yet.');
//     return;
//   }

//   // Ensure web fonts are loaded so text snapshots use the right font
//   if (document.fonts && document.fonts.ready) {
//     try { await document.fonts.ready; } catch {}
//   }

//   // --- 1) Build an off-screen sandbox with a cloned #result ---
//   const sandbox = document.createElement('div');
//   sandbox.className = 'export-only';
//   sandbox.style.cssText = [
//     'position:fixed',
//     'left:-200vw',
//     'top:0',
//     `width:${result.scrollWidth || result.clientWidth || window.innerWidth}px`,
//     'background:#fff',
//     'pointer-events:none',
//     'opacity:0',
//     'z-index:-1',
//   ].join(';');

//   const clone = result.cloneNode(true);
//   sandbox.appendChild(clone);
//   document.body.appendChild(sandbox);

//   // Let the browser layout/paint before capture
//   const waitNextFrame = () =>
//     new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
//   await waitNextFrame();

//   // Prefer explicit pages; else capture the whole clone
//   const root = sandbox.querySelector('#result') || sandbox;
//   const pageNodes = Array.from(root.querySelectorAll('.pdf-only .pdf-page'));
//   const targets = pageNodes.length ? pageNodes : [root];

//   // --- 2) Setup jsPDF and slicer ---
//   const pdf = new jsPDF('p', 'mm', 'a4');
//   const pdfW = pdf.internal.pageSize.getWidth();
//   const pdfH = pdf.internal.pageSize.getHeight();

//   // Margins (mm)
//   const MARGIN_T = 12, MARGIN_R = 12, MARGIN_B = 16, MARGIN_L = 12;

//   // Collect link rects relative to an element (CSS px), then scale to canvas px
//   function collectLinkRects(el, renderScale) {
//     const base = el.getBoundingClientRect();
//     // Only real, navigable URLs (ignore #anchors)
//     const anchors = Array.from(el.querySelectorAll('a[href]'))
//       .filter(a => {
//         const href = a.getAttribute('href') || '';
//         return href && !href.startsWith('#');
//       });
//     return anchors.map(a => {
//       const r = a.getBoundingClientRect();
//       return {
//         href: a.href, // absolute URL
//         x: (r.left - base.left) * renderScale,
//         y: (r.top  - base.top ) * renderScale,
//         w: Math.max(1, r.width  * renderScale),
//         h: Math.max(1, r.height * renderScale),
//       };
//     });
//   }

//   // Add a rendered canvas as one or multiple PDF pages; overlay link hotspots
//   function addCanvasAsPages(canvas, isFirstPage, linkRects) {
//     const usableW = pdfW - (MARGIN_L + MARGIN_R);     // mm
//     const usableH = pdfH - (MARGIN_T + MARGIN_B);     // mm
//     const pxToMm = usableW / canvas.width;            // mm per canvas px
//     const scaledH = canvas.height * pxToMm;           // mm

//     // Single-page case
//     if (scaledH <= usableH) {
//       if (!isFirstPage) pdf.addPage();
//       pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG',
//                    MARGIN_L, MARGIN_T, usableW, scaledH);

//       // Overlay all links
//       for (const L of linkRects) {
//         const xmm = MARGIN_L + L.x * pxToMm;
//         const ymm = MARGIN_T + L.y * pxToMm;
//         const wmm = L.w * pxToMm;
//         const hmm = Math.max(0.5, L.h * pxToMm); // keep a minimum clickable height
//         pdf.link(xmm, ymm, wmm, hmm, { url: L.href });
//       }
//       return;
//     }

//     // Multi-page slicing: slice the big canvas in bitmap space,
//     // then map only the links that intersect each slice.
//     const sliceHpx = Math.floor(usableH / pxToMm); // px per page slice
//     let y = 0, pageIndex = 0;

//     while (y < canvas.height) {
//       const h = Math.min(sliceHpx, canvas.height - y);

//       const slice = document.createElement('canvas');
//       slice.width = canvas.width;
//       slice.height = h;
//       const g = slice.getContext('2d');
//       g.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);

//       if (!(isFirstPage && pageIndex === 0)) pdf.addPage();
//       pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG',
//                    MARGIN_L, MARGIN_T, usableW, h * pxToMm);

//       // Overlay links that intersect this slice
//       const sliceBottom = y + h;
//       for (const L of linkRects) {
//         const Lbottom = L.y + L.h;
//         if (Lbottom <= y || L.y >= sliceBottom) continue; // no overlap

//         const inSliceY = Math.max(0, L.y - y);
//         const cropH = Math.min(L.h, sliceBottom - L.y);

//         const xmm = MARGIN_L + L.x * pxToMm;
//         const ymm = MARGIN_T + inSliceY * pxToMm;
//         const wmm = L.w * pxToMm;
//         const hmm = Math.max(0.5, cropH * pxToMm);
//         pdf.link(xmm, ymm, wmm, hmm, { url: L.href });
//       }

//       y += h;
//       pageIndex++;
//     }
//   }

//   try {
//     // --- 3) Render each target and assemble the PDF ---
//     let first = true;
//     for (const el of targets) {
//       const renderScale = Math.min(2, window.devicePixelRatio || 1.5);
//       const canvas = await html2canvas(el, {
//         scale: renderScale,
//         useCORS: true,          // requires images served with CORS headers
//         allowTaint: false,      // safer: prevents tainted canvas breaking toDataURL
//         backgroundColor: '#ffffff',
//         // Use the element’s width to avoid global layout influence
//         windowWidth: el.scrollWidth || document.documentElement.clientWidth
//       });

//       const linkRects = collectLinkRects(el, renderScale);
//       addCanvasAsPages(canvas, first, linkRects);
//       first = false;
//     }

//     // --- 4) Optional footer on each page ---
//     const total = pdf.getNumberOfPages();
//     for (let i = 1; i <= total; i++) {
//       pdf.setPage(i);
//       const w = pdf.internal.pageSize.getWidth();
//       const h = pdf.internal.pageSize.getHeight();
//       pdf.setFont('helvetica', 'normal');
//       pdf.setFontSize(9);
//       pdf.setTextColor(120);
//       pdf.setDrawColor(200);
//       pdf.setLineWidth(0.2);
//       // Horizontal rule
//       pdf.line(MARGIN_L, h - 12, w - MARGIN_R, h - 12);
//       // Left footer text
//       pdf.text('© Albury City · Exempt Development Checker', MARGIN_L, h - 6);
//       // Right page numbers
//       pdf.text(`Page ${i} of ${total}`, w - MARGIN_R, h - 6, { align: 'right' });
//     }

//     pdf.save('assessment-result.pdf');
//   } catch (err) {
//     console.error(err);
//     alert('Sorry—there was a problem generating the PDF.');
//   } finally {
//     // Always remove the sandbox so nothing leaks to the DOM
//     sandbox.remove();
//   }
// }
async function exportPdf() {
  const { jsPDF } = window.jspdf;

  const result = document.getElementById('result');
  if (!result) {
    alert('No result to export yet.');
    return;
  }

  // Ensure web fonts are loaded so text snapshots use the right font
  if (document.fonts && document.fonts.ready) {
    try { await document.fonts.ready; } catch {}
  }

  // --- 1) Build an off-screen sandbox with a cloned #result ---
  const sandbox = document.createElement('div');
  sandbox.className = 'export-only';
  sandbox.style.cssText = [
    'position:fixed',
    'left:-200vw',
    'top:0',
    `width:${result.scrollWidth || result.clientWidth || window.innerWidth}px`,
    'background:#fff',
    'pointer-events:none',
    'opacity:0',
    'z-index:-1',
  ].join(';');

  const clone = result.cloneNode(true);
  sandbox.appendChild(clone);
  document.body.appendChild(sandbox);

  // Let the browser layout/paint before capture
  const waitNextFrame = () =>
    new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  await waitNextFrame();

  // Prefer explicit pages; else capture the whole clone
  const root = sandbox.querySelector('#result') || sandbox;
  const pageNodes = Array.from(root.querySelectorAll('.pdf-only .pdf-page'));

  //Assessment Summary first, then Assessment Result, then others ---
  let targets = (pageNodes.length ? pageNodes : [root]);

  const score = (el) => {
    // Priority via data-section if present; else fall back to text sniffing
    const ds = (el.dataset && el.dataset.section || '').toLowerCase();
    const txt = (el.innerText || el.textContent || '').toLowerCase();

    if (ds.includes('summary') || txt.includes('assessment summary')) return 0;
    if (ds.includes('result')  || txt.includes('assessment result'))  return 1;
    return 2; // anything else after those two
  };

  targets = targets.slice().sort((a, b) => score(a) - score(b));

  // --- 2) Setup jsPDF and slicer ---
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();

  // Margins (mm)
  const MARGIN_T = 12, MARGIN_R = 12, MARGIN_B = 16, MARGIN_L = 12;

  // Collect link rects relative to an element (CSS px), then scale to canvas px
  function collectLinkRects(el, renderScale) {
    const base = el.getBoundingClientRect();
    // Only real, navigable URLs (ignore #anchors)
    const anchors = Array.from(el.querySelectorAll('a[href]'))
      .filter(a => {
        const href = a.getAttribute('href') || '';
        return href && !href.startsWith('#');
      });
    return anchors.map(a => {
      const r = a.getBoundingClientRect();
      return {
        href: a.href, // absolute URL
        x: (r.left - base.left) * renderScale,
        y: (r.top  - base.top ) * renderScale,
        w: Math.max(1, r.width  * renderScale),
        h: Math.max(1, r.height * renderScale),
      };
    });
  }

  // Add a rendered canvas as one or multiple PDF pages; overlay link hotspots
  function addCanvasAsPages(canvas, isFirstPage, linkRects) {
    const usableW = pdfW - (MARGIN_L + MARGIN_R);     // mm
    const usableH = pdfH - (MARGIN_T + MARGIN_B);     // mm
    const pxToMm = usableW / canvas.width;            // mm per canvas px
    const scaledH = canvas.height * pxToMm;           // mm

    // Single-page case
    if (scaledH <= usableH) {
      if (!isFirstPage) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG',
                   MARGIN_L, MARGIN_T, usableW, scaledH);

      // Overlay all links
      for (const L of linkRects) {
        const xmm = MARGIN_L + L.x * pxToMm;
        const ymm = MARGIN_T + L.y * pxToMm;
        const wmm = L.w * pxToMm;
        const hmm = Math.max(0.5, L.h * pxToMm); // keep a minimum clickable height
        pdf.link(xmm, ymm, wmm, hmm, { url: L.href });
      }
      return;
    }

    // Multi-page slicing
    const sliceHpx = Math.floor(usableH / pxToMm); // px per page slice
    let y = 0, pageIndex = 0;

    while (y < canvas.height) {
      const h = Math.min(sliceHpx, canvas.height - y);

      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = h;
      const g = slice.getContext('2d');
      g.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);

      if (!(isFirstPage && pageIndex === 0)) pdf.addPage();
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG',
                   MARGIN_L, MARGIN_T, usableW, h * pxToMm);

      // Overlay links that intersect this slice
      const sliceBottom = y + h;
      for (const L of linkRects) {
        const Lbottom = L.y + L.h;
        if (Lbottom <= y || L.y >= sliceBottom) continue; // no overlap

        const inSliceY = Math.max(0, L.y - y);
        const cropH = Math.min(L.h, sliceBottom - L.y);

        const xmm = MARGIN_L + L.x * pxToMm;
        const ymm = MARGIN_T + inSliceY * pxToMm;
        const wmm = L.w * pxToMm;
        const hmm = Math.max(0.5, cropH * pxToMm);
        pdf.link(xmm, ymm, wmm, hmm, { url: L.href });
      }

      y += h;
      pageIndex++;
    }
  }

  try {
    // --- 3) Render each target and assemble the PDF ---
    let first = true;
    for (const el of targets) {
      const renderScale = Math.min(2, window.devicePixelRatio || 1.5);
      const canvas = await html2canvas(el, {
        scale: renderScale,
        useCORS: true,          // requires images served with CORS headers
        allowTaint: false,      // safer: prevents tainted canvas breaking toDataURL
        backgroundColor: '#ffffff',
        // Use the element’s width to avoid global layout influence
        windowWidth: el.scrollWidth || document.documentElement.clientWidth
      });

      const linkRects = collectLinkRects(el, renderScale);
      addCanvasAsPages(canvas, first, linkRects);
      first = false;
    }

    // --- 4) Optional footer on each page ---
    const total = pdf.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(120);
      pdf.setDrawColor(200);
      pdf.setLineWidth(0.2);
      // Horizontal rule
      pdf.line(MARGIN_L, h - 12, w - MARGIN_R, h - 12);
      // Left footer text
      pdf.text('© Albury City · Exempt Development Assessment', MARGIN_L, h - 6);
      // Right page numbers
      pdf.text(`Page ${i} of ${total}`, w - MARGIN_R, h - 6, { align: 'right' });
    }

    pdf.save('assessment-result.pdf');
  } catch (err) {
    console.error(err);
    alert('Sorry—there was a problem generating the PDF.');
  } finally {
    // Always remove the sandbox so nothing leaks to the DOM
    sandbox.remove();
  }
}


// ======== RESET ========
function resetForm() {
  var inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
  for (var i = 0; i < inputs.length; i++) inputs[i].value = "";

  var selects = document.querySelectorAll("select");
  for (var j = 0; j < selects.length; j++) selects[j].value = "";

  hide(shedFields);
  hide(patioFields);

  // hide conditional fields for both sections
  hideFieldAndClear(shedFields, "#reflective");
  hideFieldAndClear(shedFields, "#distance_dwelling");
  hideFieldAndClear(shedFields, "#non_combustible");
  hideFieldAndClear(shedFields, "#interfere");

  hideFieldAndClear(patioFields, "#reflective");
  hideFieldAndClear(patioFields, "#distance_dwelling");
  hideFieldAndClear(patioFields, "#non_combustible");
  hideFieldAndClear(patioFields, "#interfere");

  // replacement-only patio fields
  hideFieldAndClear(patioFields, "#height_existing");
  hideFieldAndClear(patioFields, "#material_quality");
  hideFieldAndClear(patioFields, "#same_size");



  // conditionally shown fields
  hideFieldAndClear(patioFields, "#overhang");
  hideFieldAndClear(patioFields, "#attached");
  hideFieldAndClear(patioFields, "#roof_height");
  hideFieldAndClear(patioFields, "#fascia_connection");
  hideFieldAndClear(shedFields,  "#overhang");
  hideFieldAndClear(patioFields, "#stormwater");
  hideFieldAndClear(patioFields, "#above_gutter");
  hideFieldAndClear(shedFields,  "#above_gutter");
  hideFieldAndClear(patioFields, "#engineer_spec");
  hideFieldAndClear(shedFields,  "#engineer_spec");

  resultPre.textContent = "";
  showDownloadIfReady();

  window.scrollTo({ top: 0, behavior: "smooth" });
  document.getElementById("address").focus();
}

function hideFieldAndClear(section, selector) {
  if (!section) return;
  var el = section.querySelector(selector);
  if (!el) return;
  var f = fieldOf(el);
  if (f) hide(f);
  el.value = "";
}


// ======== ASSESSMENT RESULT ========

// Turn URLs into clickable <a> tags
function autoLink(text) {
  var urlRe = /(https?:\/\/[^\s<>"']+)/g;
  return text.replace(urlRe, function(url) {
    var safe = url.replace(/"/g, "&quot;");
    return '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
  });
}

// Accept raw server text; if it's a JSON array, format into bullets with links.
function formatAssessmentHtml(raw) {
  var arr = null;

  // Try parse as JSON array
  try {
    var parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) arr = parsed.map(String);
  } catch (_) {}

  // If not JSON array, fall back to splitting lines
  if (!arr) {
    arr = String(raw).split(/\r?\n/).filter(Boolean);
  }

  if (!arr.length) return "(no response)";

  // The first line is usually a headline; keep it as a standalone line (no bullet)
  var lines = [];
  var first = arr[0] || "";
  var rest  = arr.slice(1);

  // ADDING THE ICON 
  function headlineBadge(text) {
    var t = (text || "").toLowerCase();

    // Strong match for your exact phrasing first:
    if (t.includes("does not qualify")) {
      return '<span class="status-badge status-bad">❌</span> ';
    }
    if (t.includes("qualifies")) {
      return '<span class="status-badge status-ok">✅</span> ';
    }
    // Fallback: no badge
    return "";
  }

  // Build bullets as real <li> items; when a line is just a URL, append it to the previous line
  var buffer = [];
  for (var i = 0; i < rest.length; i++) {
    var s = (rest[i] || "").trim();
    if (!s) continue;

    var isUrl = /^https?:\/\//i.test(s);
    if (isUrl) {
      var linkHtml = autoLink(s);
      if (buffer.length) {
        // append the link to the previous <li>
        buffer[buffer.length - 1] = buffer[buffer.length - 1].replace(/<\/li>$/, "") + " " + linkHtml + "</li>";
      } else {
        // if a URL appears first, make it its own list item
        buffer.push("<li>" + linkHtml + "</li>");
      }
    } else {
      // make a real list item (strip any leading "- " just in case)
      buffer.push("<li>" + autoLink(s.replace(/^-+\s*/, "")) + "</li>");
    }
  }

  var gap = "<br><br>"; // extra space between bullets

  // Auto-link and join with <br> to keep compatibility with <pre>
  var html = "";
  if (first.trim()) {
    var badge = headlineBadge(first);
    html += '<p class="result-head">' + badge + autoLink(first) + '</p>';
  }
  if (buffer.length) {
    html += '<ul class="kv reasons">' + buffer.join("") + '</ul>';
  }
  return html || "(no response)";
}


//Adding check for negative value
function enforceNonNegativeOnBlur() {
  document.querySelectorAll('input[type="number"]').forEach((input) => {
    input.min = '0';
    input.addEventListener('blur', function () {
      if (this.value.trim() === '') return;
      const v = parseFloat(this.value);
      if (!isNaN(v) && v < 0) {
        this.value = ''; // optional
        this.setCustomValidity('Negative values are not allowed.');
        this.reportValidity();        
        this.focus();                 
      } else {
        this.setCustomValidity('');   // clear message
      }
    });

    // clear the message as the user types again
    input.addEventListener('input', function () {
      this.setCustomValidity('');
    });
  });
}
document.addEventListener('DOMContentLoaded', enforceNonNegativeOnBlur);



function prettifyLinks(html, {mode = "domain", label = "SEPP", force = false} = {}) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;

  tpl.content.querySelectorAll("a[href]").forEach(a => {
    let urlObj = null;
    try {
      urlObj = new URL(a.getAttribute("href"), location.href);
    } catch {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
      return;
    }

    const text = a.textContent.trim();
    const shouldRewrite = force || text === a.href || text.length > 50;

    if (shouldRewrite) {
      if (mode === "domain") {
        a.textContent = urlObj.hostname.replace(/^www\./, "");
      } else if (mode === "domain+page") {
        const parts = urlObj.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] || "";
        a.textContent =
          urlObj.hostname.replace(/^www\./, "") +
          (last ? `/${decodeURIComponent(last).slice(0, 30)}${last.length > 30 ? "…" : ""}` : "");
      } else if (mode === "label") {
        a.textContent = label;

        
        const next = a.nextSibling;
        
        const m = next && next.nodeType === Node.TEXT_NODE
          ? next.textContent.match(/^\s*((?:\([^()]+\))+)/)
          : null;

        if (m) {
          a.textContent += " " + m[1].trim();        
          next.textContent = next.textContent.slice(m[0].length); // remove what we consumed
        }
      }
      a.classList.add("short-link");
    }

    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });

  return tpl.innerHTML;
}
