// app.js

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

  // NEW: roof === "yes" -> show stormwater
  setupRoofStormwater(shedFields);
  setupRoofStormwater(patioFields);

  // NEW: attached === "yes" -> show above_gutter
  setupAttachedAboveGutter(shedFields);
  setupAttachedAboveGutter(patioFields);

  // NEW: fascia_connection === "yes" -> show engineer_spec
  setupFasciaEngineerSpec(shedFields);
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
  var bush = section.querySelector("#bushfire");
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

  // NEW re-triggers for added conditionals
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
  var bush = section.querySelector("#bushfire");
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

  // replacement-only
  var deck1m = section.querySelector("#deck_above_1m");
  var matEq  = section.querySelector("#materials_equivalent");
  var sizeCh = section.querySelector("#deck_size_change");
  var deck1mField = fieldOf(deck1m);
  var matEqField  = fieldOf(matEq);
  var sizeChField = fieldOf(sizeCh);

  // overlapping originals
  var matQual = section.querySelector("#material_quality");
  var sameSize = section.querySelector("#same_size");
  var matQualField = fieldOf(matQual);
  var sameSizeField = fieldOf(sameSize);

  // if the replacement fields aren't present, bail safely
  if (!deck1mField || !matEqField || !sizeChField) return;

  function update() {
    var isReplacement = (type.value || "").toLowerCase() === "replacement";

    if (isReplacement) {
      // show replacement-only fields
      show(deck1mField);
      show(matEqField);
      show(sizeChField);
      // hide overlapping originals
      if (matQualField) { hide(matQualField); if (matQual) matQual.value = ""; }
      if (sameSizeField) { hide(sameSizeField); if (sameSize) sameSize.value = ""; }
    } else {
      // hide replacement-only
      hide(deck1mField);  if (deck1m) deck1m.value = "";
      hide(matEqField);   if (matEq)  matEq.value  = "";
      hide(sizeChField);  if (sizeCh) sizeCh.value = "";
      // show originals again
      if (matQualField) show(matQualField);
      if (sameSizeField) show(sameSizeField);
    }
  }

  type.addEventListener("change", update);
  update();
}

// 6) roof === "yes" -> show overhang
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
    }
  }
  roof.addEventListener("change", update);
  update();
}

// NEW: roof === "yes" -> show stormwater
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

// NEW: attached === "yes" -> show above_gutter
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

// NEW: fascia_connection === "yes" -> show engineer_spec
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

// ======== SUBMIT ========
function handleSubmit() {
  var dev = devSelect.value;
  if (!dev) { alert("Select development type"); return; }

  var payload = {
    development: dev,
    zoning: document.getElementById("zoning").value,
    address: document.getElementById("address").value,
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
    payload.bushfire = valFrom(r, "#bushfire");
    payload.distance_dwelling = numFrom(r, "#distance_dwelling");
    payload.non_combustible = valFrom(r, "#non_combustible");
    payload.adjacent_building = valFrom(r, "#adjacent_building");
    payload.interfere = valFrom(r, "#interfere");
    payload.habitable = valFrom(r, "#habitable");
    payload.easement = valFrom(r, "#easement");
    payload.services = valFrom(r, "#services");
    payload.existing_structures = valFrom(r, "#existing_structures");
    payload.roof = valFrom(r, "#roof");
    payload.overhang = numFrom(r, "#overhang");
    payload.attached = valFrom(r, "#attached");
    payload.above_gutter = valFrom(r, "#above_gutter");
    payload.fascia_connection = valFrom(r, "#fascia_connection");
    payload.engineer_spec = valFrom(r, "#engineer_spec");
  }

  // Patio-only fields
  if (dev === "patio") {
    var p = patioFields;
    payload.structure_type = valFrom(p, "#structure_type");
    payload.height_existing = numFrom(p, "#height_existing");
    payload.material_quality = valFrom(p, "#material_quality");
    payload.same_size = valFrom(p, "#same_size");
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
    payload.overhang = numFrom(p, "#overhang");
    payload.attached = valFrom(p, "#attached");
    payload.above_gutter = valFrom(p, "#above_gutter");
    payload.roof_height = numFrom(p, "#roof_height");
    payload.fascia_connection = valFrom(p, "#fascia_connection");
    payload.engineer_spec = valFrom(p, "#engineer_spec");
    payload.stormwater = valFrom(p, "#stormwater"); // now conditional via roof
    payload.drainage = valFrom(p, "#drainage");
    payload.bushfire = valFrom(p, "#bushfire");
    payload.distance_dwelling = numFrom(p, "#distance_dwelling");
    payload.non_combustible = valFrom(p, "#non_combustible");
    payload.adjacent_building = valFrom(p, "#adjacent_building");
    payload.interfere = valFrom(p, "#interfere");

    // replacement-only patio answers
    payload.deck_above_1m        = valFrom(p, "#deck_above_1m");
    payload.materials_equivalent = valFrom(p, "#materials_equivalent");
    payload.deck_size_change     = valFrom(p, "#deck_size_change");
  }

  fetch("/get-assessment-result/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(function (res) { return res.text(); })
    .then(function (text) {
      var summary = buildSummary(payload);
      var output = "Your answers\n------------\n" + summary +
        "\n\nAssessment result\n-----------------\n" + (text.trim() || "(no response)");
      resultPre.textContent = output;
      showDownloadIfReady();
    })
    .catch(function (err) {
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
    if (v === "" || v === null || v === undefined) v = "(not specified)";
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

function exportPdf() {
  var text = (resultPre.textContent || "").trim() || "No result.";
  var jsPDFLib = window.jspdf;
  var doc = new jsPDFLib.jsPDF({ unit: "pt", format: "a4" });
  var margin = 40;
  var pageW = doc.internal.pageSize.getWidth();
  var pageH = doc.internal.pageSize.getHeight();
  var maxW = pageW - margin * 2;
  var lineH = 14;

  doc.setFont("courier", "normal");
  doc.setFontSize(11);

  var lines = doc.splitTextToSize(text, maxW);
  var y = margin;

  for (var i = 0; i < lines.length; i++) {
    if (y > pageH - margin) { doc.addPage(); y = margin; }
    doc.text(lines[i], margin, y);
    y += lineH;
  }

  doc.save("assessment-result.pdf");
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
  hideFieldAndClear(patioFields, "#deck_above_1m");
  hideFieldAndClear(patioFields, "#materials_equivalent");
  hideFieldAndClear(patioFields, "#deck_size_change");

  // overlapping originals (ensure they’re hidden if patio was replacement)
  hideFieldAndClear(patioFields, "#material_quality");
  hideFieldAndClear(patioFields, "#same_size");

  // NEW: conditionally shown fields
  hideFieldAndClear(patioFields, "#overhang");
  hideFieldAndClear(shedFields,  "#overhang");
  hideFieldAndClear(patioFields, "#stormwater");
  hideFieldAndClear(shedFields,  "#stormwater");
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
