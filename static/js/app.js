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
var devSelect, shedFields, patioFields, sensitiveLabel;
var submitBtn, resetBtn, resultPre, downloadPdfBtn;

// ======== INIT ========
function init() {
  devSelect = document.getElementById("development");
  shedFields = document.getElementById("shed-fields");
  patioFields = document.getElementById("patio-fields");
  sensitiveLabel = document.getElementById("sensitive-area-label");
  submitBtn = document.getElementById("submit");
  resetBtn = document.getElementById("reset");
  resultPre = document.getElementById("result");
  downloadPdfBtn = document.getElementById("download-pdf");

  devSelect.addEventListener("change", applyDevVisibility);
  submitBtn.addEventListener("click", handleSubmit);
  resetBtn.addEventListener("click", resetForm);
  downloadPdfBtn.addEventListener("click", exportPdf);

  // start hidden
  hide(shedFields);
  hide(patioFields);
  hide(sensitiveLabel);

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
  var bush = section.querySelector("#bushfire_shed, #bushfire_patio");
  if (bush) bush.dispatchEvent(new Event("change"));
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
   
  var bush = section.querySelector("#bushfire_shed, #bushfire_patio");
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

  // All six fields we want only in "replacement" mode
  // var deck1m   = section.querySelector("#deck_above_1m");
  // var matEq    = section.querySelector("#materials_equivalent");
  // var sizeCh   = section.querySelector("#deck_size_change");
  var hExisting= section.querySelector("#height_existing");
  var matQual  = section.querySelector("#material_quality");
  var sameSize = section.querySelector("#same_size");

  // Bail if the replacement trio doesn’t exist (means this isn’t the patio section)
  if (!hExisting || !matQual || !sameSize) return;

  /// var deck1mField   = fieldOf(deck1m);
  /// var matEqField    = fieldOf(matEq);
  /// var sizeChField   = fieldOf(sizeCh);
  var hExistingField= fieldOf(hExisting);
  var matQualField  = fieldOf(matQual);
  var sameSizeField = fieldOf(sameSize);

  function clear(el) { if (el) el.value = ""; }
  function showIf(f)  { if (f) show(f); }
  function hideIf(f)  { if (f) hide(f); }

  function update() {
    var isReplacement = (type.value || "").toLowerCase() === "replacement";

    if (isReplacement) {
      // show ALL six
      // showIf(deck1mField);
      // showIf(matEqField);
      // showIf(sizeChField);
      showIf(hExistingField);
      showIf(matQualField);
      showIf(sameSizeField);
    } else {
      // hide & clear ALL six
      // hideIf(deck1mField);    clear(deck1m);
      // hideIf(matEqField);     clear(matEq);
      // hideIf(sizeChField);    clear(sizeCh);
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
  hide(sensitiveLabel);

  if (devSelect.value === "shed") {
    show(shedFields);
    show(sensitiveLabel);
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
    foreshore: document.getElementById("foreshore").value
  };
  
  // Shed-only fields
  if (dev === "shed") {
    payload.sensitive_area = document.getElementById("sensitive_area").value;
    var r = shedFields;
    payload.area = numFrom(r, "#area");
    payload.height = numFrom(r, "#height");
    payload.boundary_distance = numFrom(r, "#boundary_distance");
    payload.building_line = valFrom(r, "#building_line");
    payload.shipping_container = valFrom(r, "#shipping_container");
    payload.stormwater = valFrom(r, "#stormwater"); // now conditional via roof
    payload.metal = valFrom(r, "#metal");
    payload.reflective = valFrom(r, "#reflective");
    payload.bushfire = valFrom(r, "#bushfire_shed");
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
    payload.land_size = numFrom(p, "#land_size");
    payload.total_structures_area = numFrom(p, "#total_structures_area");
    payload.wall_height = valFrom(p, "#wall_height");
    payload.behind_building_line = valFrom(p, "#behind_building_line");
    payload.boundary_distance = numFrom(p, "#boundary_distance");
    payload.metal = valFrom(p, "#metal");
    payload.reflective = valFrom(p, "#reflective");
    payload.floor_height = numFrom(p, "#floor_height");
    payload.roof = valFrom(p, "#roof");
    payload.drainage = valFrom(p, "#drainage");
    payload.bushfire = valFrom(p, "#bushfire_patio");
    payload.distance_dwelling = numFrom(p, "#distance_dwelling");
    payload.non_combustible = valFrom(p, "#non_combustible");

    // replacement-only patio answers
    // payload.deck_above_1m        = valFrom(p, "#deck_above_1m");
    // payload.materials_equivalent = valFrom(p, "#materials_equivalent");
    // payload.deck_size_change     = valFrom(p, "#deck_size_change");
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

  // For testing: optionally add a "sleep" parameter to simulate a slow response  
    //const url = DEBUG_SLEEP_SECS > 0
      //? `/get-assessment-result/?debug_sleep=${DEBUG_SLEEP_SECS}`
      //: `/get-assessment-result/`;


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
        var summary = buildSummary(payload);

        // Build a nice-looking combined output:
        // We use innerHTML so links are clickable, but preserve a simple text section for answers.
        var answersBlock =
        "Your answers\n------------\n" + summary;

        var assessmentTitle =
        "\n\n\n";

        // Beautify the server response (bullets + clickable links)
        var assessmentHtml = formatAssessmentHtml(raw);

        // resultPre.innerHTML =
        // answersBlock.replace(/&/g, "&amp;")
        //             .replace(/</g, "&lt;")
        //             .replace(/>/g, "&gt;") // escape answers (plain text)
        // + assessmentTitle.replace(/&/g, "&amp;")
        //                 .replace(/</g, "&lt;")
        //                 .replace(/>/g, "&gt;")
        // + assessmentHtml; // already HTML with links

        resultPre.innerHTML =
          answersBlock.replace(/&/g, "&amp;")
                      .replace(/</g, "&lt;")
                      .replace(/>/g, "&gt;") // plain text
          + assessmentTitle.replace(/&/g, "&amp;")
                          .replace(/</g, "&lt;")
                          .replace(/>/g, "&gt;")
          + prettifyLinks(assessmentHtml, { mode: "domain+page" }); // short link text

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

// ======== SUMMARY + PDF ========
function buildSummary(obj) {
  var lines = [];
  for (var k in obj) {
    var v = obj[k];
    if (v === "" || v === null || v === undefined) continue; 
    lines.push("• " + k + ": " + v);
  }
  return lines.join("\n");
}


function showDownloadIfReady() {
  if ((resultPre.textContent || "").trim()) {
    downloadPdfBtn.classList.remove("hidden");
  } else {
    downloadPdfBtn.classList.add("hidden");
  }
}

// function exportPdf() {
//   var text = (resultPre.textContent || "").trim() || "No result.";
//   var jsPDFLib = window.jspdf;
//   var doc = new jsPDFLib.jsPDF({ unit: "pt", format: "a4" });
//   var margin = 40;
//   var pageW = doc.internal.pageSize.getWidth();
//   var pageH = doc.internal.pageSize.getHeight();
//   var maxW = pageW - margin * 2;
//   var lineH = 14;

//   doc.setFont("courier", "normal");
//   doc.setFontSize(11);

//   var lines = doc.splitTextToSize(text, maxW);
//   var y = margin;

//   for (var i = 0; i < lines.length; i++) {
//     if (y > pageH - margin) { doc.addPage(); y = margin; }
//     doc.text(lines[i], margin, y);
//     y += lineH;
//   }

//   doc.save("assessment-result.pdf");
// }






// ======== RESET ========

function exportPdf() {
  const { jsPDF } = window.jspdf;
  const input = document.body; // Or the main container ID

  // 1. Define the IDs of the buttons to hide
  const buttonIds = ['submit', 'reset', 'download-pdf'];
  
  // 2. Hide all specified buttons
  const buttonsToHide = buttonIds
    .map(id => document.getElementById(id))
    .filter(btn => btn !== null); // Ensure the button element actually exists

  buttonsToHide.forEach(btn => {
    btn.style.display = 'none';
  });

  // Use html2canvas to render the HTML element to a canvas
  html2canvas(input, { scale: 2 }).then((canvas) => {
    
    // 3. IMMEDIATELY show all buttons again after capture
    buttonsToHide.forEach(btn => {
      btn.style.display = ''; // Restore the default display style
    });

    const imgData = canvas.toDataURL('image/png');

    // PDF generation logic (same as before)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; 
    const pageHeight = 295; 
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save the PDF file
    pdf.save('assessment-result.pdf');
  });
}

// ======== RESET ========
function resetForm() {
  var inputs = document.querySelectorAll('input[type="text"], input[type="number"]');
  for (var i = 0; i < inputs.length; i++) inputs[i].value = "";

  var selects = document.querySelectorAll("select");
  for (var j = 0; j < selects.length; j++) selects[j].value = "";

  hide(shedFields);
  hide(patioFields);
  hide(sensitiveLabel);

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
  // hideFieldAndClear(patioFields, "#deck_above_1m");
  // hideFieldAndClear(patioFields, "#materials_equivalent");
  // hideFieldAndClear(patioFields, "#deck_size_change");
  hideFieldAndClear(patioFields, "#height_existing");
  hideFieldAndClear(patioFields, "#material_quality");
  hideFieldAndClear(patioFields, "#same_size");



  // NEW: conditionally shown fields
  hideFieldAndClear(patioFields, "#overhang");
  hideFieldAndClear(patioFields, "#attached");
  hideFieldAndClear(patioFields, "#roof_height");
  hideFieldAndClear(patioFields, "#fascia_connection");
  hideFieldAndClear(shedFields,  "#overhang");
  hideFieldAndClear(patioFields, "#stormwater");
  //hideFieldAndClear(shedFields,  "#stormwater");
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

  //ADDING THE iCON 
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


  // Build bullet-y lines; when a line is just a URL, append it to the previous line
  var buffer = [];
  for (var i = 0; i < rest.length; i++) {
    var s = (rest[i] || "").trim();
    if (!s) continue;

    var isUrl = /^https?:\/\//i.test(s);
    if (isUrl) {
      if (s.includes("https://legislation.nsw.gov.au/view/")) {
       buffer.push("   " + s); // Porocess the link as exception 
      } else if (buffer.length) {
        buffer[buffer.length - 1] += " " + s;  
      } else {
        buffer.push(s);
      }
      
    } else {
    buffer.push("- " + s);
    }
  }

  var gap = "<br><br>"; // extra space between bullets

  // Auto-link and join with <br> to keep compatibility with <pre>
  var html = "";
  if (first.trim()) {
    var badge = headlineBadge(first);
    html += badge + autoLink(first) + "<br>";
  }
  if (buffer.length) {
    html += autoLink(buffer.join("<br>"));
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


function prettifyLinks(html, {mode = "domain"} = {}) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  tpl.content.querySelectorAll("a[href]").forEach(a => {
    const url = new URL(a.getAttribute("href"), location.href);

    // Only rewrite if the link text is the raw URL or is very long
    const text = a.textContent.trim();
    if (text === a.href || text.length > 50) {
      if (mode === "domain") {
        a.textContent = url.hostname.replace(/^www\./, "");
      } else if (mode === "domain+page") {
        const parts = url.pathname.split("/").filter(Boolean);
        const last = parts[parts.length - 1] || "";
        a.textContent = url.hostname.replace(/^www\./, "") + (last ? `/${decodeURIComponent(last).slice(0,30)}${last.length>30?"…":""}` : "");
      } else if (mode === "label") {
        a.textContent = "View source";
      }
    }

    // (Optional) open in new tab safely
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  return tpl.innerHTML;
}