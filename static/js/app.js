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

  if (el.labels && el.labels.length) {
    return el.labels[0].textContent.trim();
  }

  const field = el.closest('.field');
  const local = field ? field.querySelector('label') : null;
  if (local) return local.textContent.trim();

  try {
    const lbl = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
    if (lbl) return lbl.textContent.trim();
  } catch (_) {}

  return (el.getAttribute('placeholder') || el.id || 'Field');
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
        const reportHtml = `
          <div id="report">
            <!-- On-screen only -->
            <div class="on-screen-only">
              <h2 class="report-title">Assessment Result</h2>
              ${reasonsHtml}
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


function drawTick(pdf, x, y, sizeMm = 6) {
  // draws a ✓ made of two lines
  pdf.setDrawColor(0, 140, 0);    // green
  pdf.setLineWidth(1.6);
  // lower-left to middle
  pdf.line(x, y, x + sizeMm * 0.45, y + sizeMm * 0.55);
  // middle to top-right
  pdf.line(x + sizeMm * 0.45, y + sizeMm * 0.55, x + sizeMm, y - sizeMm * 0.6);
}

function drawCross(pdf, x, y, sizeMm = 6) {
  // draws a red X made of two lines
  pdf.setDrawColor(220, 0, 0);    // red
  pdf.setLineWidth(1.6);
  pdf.line(x, y - sizeMm / 2, x + sizeMm, y + sizeMm / 2);
  pdf.line(x, y + sizeMm / 2, x + sizeMm, y - sizeMm / 2);
}


function formatResultHead(rawText) {
  if (!rawText) return '';

  // Aggressive cleanup:
  let cleanedText = rawText.trim()
    .replace(/^[^A-Za-z0-9]+/, '')                 
    .replace(/^\s*L\s+(?=The\b)/, '')              
    .replace(/\s+/g, ' ');

  // Case-insensitive checks
  const t = cleanedText.toUpperCase();

  if (t.includes('DOES NOT QUALIFY')) {
    // Red cross scenario (we'll color "X" in red at draw time)
    const corePhrase = 'The proposed structure DOES NOT qualify for the following reasons:';
    return 'X ' + corePhrase; // ASCII symbol; colored during rendering
  } else if (t.includes('DOES QUALIFY') || t.includes('QUALIFIES')) {
    // Green tick scenario (we'll just show "OK", can color green if desired)
    const corePhrase = 'The proposed structure DOES qualify for exempt development.';
    return '✓ ' + corePhrase;  // ASCII symbol; optionally colored
  }

  // Fallback: return the cleaned text if no known phrase is found
  return cleanedText;
}

/**
 * Helper to set link styles (blue and underline) and reset them.
 */
function setLinkStyles(pdf, isLink) {
  if (isLink) {
    // Set blue color
    pdf.setTextColor(0, 0, 255);
    // Set underline style
    pdf.setFont(undefined, 'underline');
  } else {
    // Reset to original grey color
    pdf.setTextColor(50, 50, 50);
    // Reset to normal style
    pdf.setFont(undefined, 'normal');
  }
}

/**
 * Main function to export the assessment result to a PDF.
 */
async function exportPdf() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  // --- Configuration & Metrics ---
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = pdf.internal.pageSize.getHeight();
  const MARGIN_T = 12, MARGIN_R = 12, MARGIN_B = 16, MARGIN_L = 12;
  const usableW = pdfW - (MARGIN_L + MARGIN_R);
  const LINE_GAP = 4.6;
  const BULLET_INDENT = 4.5;
  const TEXT_X = MARGIN_L + BULLET_INDENT + 1.5;
  const CONTENT_MAX_W = usableW - (TEXT_X - MARGIN_L);

  // --- DOM Data Collection ---
  const report = document.getElementById('report');
  if (!report) { alert('No result to export yet.'); return; }

  // Assumes you have a collectAnswers() that returns [{label, value}, ...]
  const answers = collectAnswers() || [];

  // Where to read reasons (list items)
  const reasonsRoot = report.querySelector('#rejection-reasons') || report;
  const resultItems = Array.from(reasonsRoot.querySelectorAll('li'));

  // Get raw head text from DOM and normalize
  const rawResultHead = (report.querySelector('.result-head')?.textContent || '').trim();
  const resultHead = formatResultHead(rawResultHead);

  // --- PDF Rendering ---
  let y = MARGIN_T;

  // Header banner
  y = renderHeaderBanner(pdf, y, pdfW, MARGIN_L, MARGIN_T, usableW);

  // Gap after banner
  y += 15;

  // Default text color
  pdf.setTextColor(50, 50, 50);

  // --- SECTION 1: Assessment Summary ---
  y = renderSectionTitle(pdf, 'Assessment Summary', MARGIN_L, y);
  y = renderAssessmentSummary(pdf, answers, MARGIN_L, y, usableW, LINE_GAP, BULLET_INDENT, TEXT_X);

  // --- SECTION 2: Assessment Result ---
  y = renderSectionTitle(pdf, 'Assessment Result', MARGIN_L, y);

  // Render the formatted headline with a drawn icon (no Unicode glyphs)
  if (resultHead) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    // Decide status straight from the text (robust to any leading tokens)
    const qualifies   = /DOES\s+QUALIFY|QUALIFIES/i.test(resultHead);
    const notQualify  = /DOES\s+NOT\s+QUALIFY/i.test(resultHead);

    // Icon position & size
    const iconX = MARGIN_L;
    const iconY = y - 1;        // slight vertical centering tweak
    const iconSize = 6;         // mm
    let textStartX = MARGIN_L;

    if (qualifies) {
      drawTick(pdf, iconX, iconY, iconSize);
      textStartX = iconX + iconSize + 2;   // space after icon
    } else if (notQualify) {
      drawCross(pdf, iconX, iconY, iconSize);
      textStartX = iconX + iconSize + 2;
    }

    // Remove any leading token like "X " or "✓ " if present
    const cleaned = resultHead.replace(/^[^\w]+/, '').replace(/^(X|✓)\s+/, '');

    // Draw the rest of the sentence in grey
    pdf.setTextColor(50, 50, 50);
    y = drawWrappedText(pdf, cleaned, textStartX, y, usableW - (textStartX - MARGIN_L), LINE_GAP);
    y += 2;
  }


  // Render the result bullet points (printed as inline text with links, no bullets)
  y = renderResultItems(pdf, resultItems, MARGIN_L, y, pdfH, MARGIN_B, LINE_GAP, BULLET_INDENT, TEXT_X, CONTENT_MAX_W);

  // --- FOOTER ---
  renderFooter(pdf, pdfW, pdfH, MARGIN_L, MARGIN_R, MARGIN_B);

  // --- Save ---
  pdf.save('assessment-result.pdf');
}

// =========================================================================
// --- Helper Functions for Rendering ---
// =========================================================================

function renderHeaderBanner(pdf, startY, pdfW, MARGIN_L, MARGIN_T, usableW) {
  let y = startY;
  const BANNER_COLOR = '#002A3A';
  const BANNER_HEIGHT = 35;
  const LINE_GAP = 4.6;

  // Draw the full-width filled rectangle
  pdf.setFillColor(BANNER_COLOR);
  pdf.rect(0, y - MARGIN_T, pdfW, BANNER_HEIGHT, 'F');

  // Set text color to white for the banner content
  pdf.setTextColor(255, 255, 255);

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('Exempt Development Assessment', MARGIN_L, y);
  y += 7;

  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.text('Sheds & Patios — Albury City', MARGIN_L, y);
  y += 6;

  // Lead description
  pdf.setFontSize(10);
  const lead = 'Check if a shed or patio qualifies as exempt development and can be built without council approval.';
  y = drawWrappedText(pdf, lead, MARGIN_L, y, usableW, LINE_GAP);
  y += 3;

  return y;
}

function renderSectionTitle(pdf, title, MARGIN_L, startY) {
  let y = startY;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text(title, MARGIN_L, y);
  y += 6;
  return y;
}

function renderAssessmentSummary(pdf, answers, MARGIN_L, startY, usableW, LINE_GAP, BULLET_INDENT, TEXT_X) {
  let y = startY;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  if (!answers || answers.length === 0) {
    y = drawWrappedText(pdf, '(No answers)', MARGIN_L, y, usableW, LINE_GAP);
  } else {
    for (const { label, value } of answers) {
      // bullet
      pdf.text('•', MARGIN_L + BULLET_INDENT, y);
      // line text
      const line = `${label}: ${value}`;
      y = drawWrappedText(pdf, line, TEXT_X, y, usableW - (TEXT_X - MARGIN_L), LINE_GAP);
      y += 1.5; // small gap between items
      if (y > pdf.internal.pageSize.getHeight() - 16 - 20) break; // hard cap for one page
    }
  }
  y += 3;
  return y;
}

function renderResultItems(pdf, resultItems, MARGIN_L, startY, pdfH, MARGIN_B, LINE_GAP, BULLET_INDENT, TEXT_X, maxW) {
  let y = startY;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  // Remove indentation for reasons; start flush left
  const NEW_TEXT_X = MARGIN_L;
  const NEW_MAX_W = pdf.internal.pageSize.getWidth() - (MARGIN_L * 2);

  for (const li of resultItems) {
    // Convert DOM to runs (text + links)
    const runs = nodeToRuns(li);

    let x = NEW_TEXT_X;
    let remainingW = NEW_MAX_W;

    for (let r = 0; r < runs.length; r++) {
      const run = runs[r];
      if (!run.text) continue;

      const isLink = (run.type === 'link' && run.href);

      // Apply link or normal text styles
      setLinkStyles(pdf, isLink);

      // Ensure spacing between adjacent runs if both are wordy and missing whitespace
      // (simple heuristic)
      if (r > 0) {
        const prev = runs[r - 1];
        if (prev && prev.text && /\w$/.test(prev.text) && /^\w/.test(run.text)) {
          // add a space
          const spaceW = pdf.getTextWidth(' ');
          if (spaceW > remainingW) {
            // move to next line
            y += LINE_GAP;
            x = NEW_TEXT_X;
            remainingW = NEW_MAX_W;
            setLinkStyles(pdf, isLink);
          } else {
            pdf.text(' ', x, y);
            x += spaceW;
            remainingW -= spaceW;
          }
        }
      }

      const pieces = pdf.splitTextToSize(run.text, remainingW);

      for (let i = 0; i < pieces.length; i++) {
        const piece = pieces[i];

        if (isLink) {
          pdf.textWithLink(piece, x, y, { url: run.href });
        } else {
          pdf.text(piece, x, y);
        }

        if (i < pieces.length - 1) {
          y += LINE_GAP;
          x = NEW_TEXT_X;
          remainingW = NEW_MAX_W;
          // Re-apply link styles at the start of the new wrapped line
          setLinkStyles(pdf, isLink);
        } else {
          const w = pdf.getTextWidth(piece);
          x += w;
          remainingW -= w;
        }
      }
    }

    // Reset styles after item
    setLinkStyles(pdf, false);

    // Finish the line
    y += LINE_GAP;
    y += 1; // small separation after each reason

    if (y > pdfH - MARGIN_B - 18) break; // keep it to one page
  }
  return y;
}

function renderFooter(pdf, pdfW, pdfH, MARGIN_L, MARGIN_R, MARGIN_B) {
  const footerY = pdfH - 12;
  pdf.setDrawColor(200);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_L, footerY, pdfW - MARGIN_R, footerY);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(120); // light grey for footer
  pdf.text('© Albury City · Exempt Development Assessment', MARGIN_L, footerY + 6);
  pdf.text('Page 1 of 1', pdfW - MARGIN_R, footerY + 6, { align: 'right' });
}

function drawWrappedText(doc, text, x, y0, width, lineGap) {
  const lines = doc.splitTextToSize(text, width);
  for (const line of lines) {
    doc.text(line, x, y0);
    y0 += lineGap;
  }
  return y0;
}

function nodeToRuns(rootEl) {
  const runs = [];
  rootEl.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (t) runs.push({ type: 'text', text: t });
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = /** @type {HTMLElement} */ (node);
      if (el.tagName === 'A') {
        const href = el.getAttribute('href') || '';
        const t = el.textContent?.replace(/\s+/g, ' ').trim();
        if (t) runs.push({ type: 'link', text: t, href });
      } else {
        // recurse into nested elements (e.g., <strong>, <em>, spans)
        nodeToRuns(el).forEach(r => runs.push(r));
      }
    }
  });
  return runs;
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
    
    // --- exclude rule for the characters '+'' '-' or 'e' ---//
    input.addEventListener('keydown', function (e) {
      if (["e", "E", "+", "-"].includes(e.key)) {
              e.preventDefault();
            }
    }); 
    
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
      a.setAttribute("title", "Opens the NSW Government Legislation website");
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

        const secMatch =
          (urlObj.hash && urlObj.hash.match(/(?:^#)?(?:sec|s|section)[\.\-_]?(\d+(?:\.\d+)*)/i)) ||
          null;
        if (secMatch) {
          a.textContent += " " + secMatch[1];
        }        

        
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
    a.setAttribute("title", "Opens the NSW Government Legislation website");
  });

  return tpl.innerHTML;
}
