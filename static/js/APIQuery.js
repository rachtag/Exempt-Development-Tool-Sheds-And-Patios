// ========================== Address and GIS API Utilities ==========================
// This ES6 module provides reusable functions to work with NSW Planning APIs.
// It includes:
//   - Address autocomplete and filtering by postcode/suburb
//   - Geocoding addresses to coordinates
//   - Generic GIS layer query function
//   - Specific queries: zone code, heritage, bushfire, foreshore, biodiversity
//   - Boundary query with geometry and lot size extraction
//
// 
// Example CONFIG keys:
//   ADDRESS_API, GEOCODE_URL, API_KEY
//   ZONING_URL, HERITAGE_URL, BUSHFIRE_URL, FBL_URL, BIODIVERSITY_URL, FEATURESERVER_URL
//   ADDRESS_POSTCODE, ADDRESS_SUBURB
//
// =======================================================================
// =============== Address Validation & Autocomplete =====================
// =======================================================================
//console.log("APIQuery.js loaded ");
let refreshPermission = false;
let isQueryRunning = false;
/**
 * Filters NSW Planning API address results using postcode (last token only).
 * @param {Array} data - Raw address results from NSW Planning API
 * @returns {Array} Filtered address results
 */


export async function validateAddressList(data) {
  try {
    if (!window.CONFIG) {
      throw new Error("CONFIG is not loaded. Please make sure ./static/js/conf/js.conf is loaded first.");
    }

    // --- Extract postcode list from config ---
    let postcodes = [];
    if (window.CONFIG.ADDRESS_POSTCODE) {
      postcodes = window.CONFIG.ADDRESS_POSTCODE
        .split(",")
        .map(pc => pc.replace(/[^\d]/g, ""))  // keep only digits
        .filter(pc => pc.length === 4);       // only 4-digit numbers
    }

    // --- Extract suburb from config ---
    let suburb = "";
    if (window.CONFIG.ADDRESS_SUBURB) {
      suburb = window.CONFIG.ADDRESS_SUBURB.trim().toLowerCase();
    }

    // Debug log
    //console.log("Loaded postcodes from config:", postcodes);
    //console.log("Loaded suburb from config:", suburb);

    // --- Filtering logic ---
    return data.filter(item => {
      const addr = (item.address || "").trim();
      if (!addr) return false;

      const parts = addr.split(/\s+/);
      const lastToken = parts[parts.length - 1]; // postcode

      const matchPostcode = postcodes.includes(lastToken);
      const matchSuburb = suburb && addr.toLowerCase().includes(suburb);

      return matchPostcode || matchSuburb;
    });

  } catch (err) {
    console.error("Validation failed:", err);
    alert("Error: Address validation failed. Please check configuration.");
    return [];
  }
}


/**
 * Fetches address suggestions from NSW Planning API and applies postcode/suburb filtering.
 * @param {string} query - User input address string
 * @returns {Array} Filtered address suggestions
 */

export async function fetchAndFilterAddresses(query) {
  try {
    if (!window.CONFIG?.ADDRESS_API) {
      console.warn("CONFIG.ADDRESS_API missing; waiting for configuration...");
      return [];
    }
    if (!query || query.length < 3) return [];

    const url = `${window.CONFIG.ADDRESS_API}?a=${encodeURIComponent(query)}&noOfRecords=15`;
    const res = await fetch(url);

    if (!res.ok) {
      console.warn(`⚠️ Address API responded ${res.status}: ${res.statusText}`);
      return [];
    }

    let data;
    try {
      data = await res.json();
    } catch (err) {
      console.error("⚠️ Failed to parse Address API JSON:", err);
      return [];
    }

    const filtered = await validateAddressList(data);
    const unique = [];
    const seen = new Set();

    for (const item of filtered) {
      if (!seen.has(item.address)) {
        seen.add(item.address);
        unique.push(item);
      }
    }

    return unique.slice(0, 5);
  } catch (err) {
    console.error("Fetch and filter failed:", err);
    // 
    return [];
  }
}






// =======================================================================
// =============== Geocoding =============================================
// =======================================================================

/**
 * Converts a text address into geographic coordinates using ArcGIS API.
 * @param {string} address - Input address string
 * @returns {Object|null} {x, y, score, address} or null if not found
 */
export async function geocodeAddress(address) {
  try {
    if (!address || address.trim().length === 0) {
      throw new Error("No address provided.");
    }

    // const response = await fetch("/geocode", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ address })
    // });
    const response = await fetch(`/geocode?address=${encodeURIComponent(address)}`);
    if (!response.ok) {
      throw new Error(`Backend geocode error: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.x && data.y) {
      return data;  // already {address, score, x, y}
    }
    return null;
  } catch (err) {
    console.error("Geocoding via backend failed:", err);
    alert("Error: Failed to convert address to coordinates.");
    return null;
  }
}

// =======================================================================
// =============== Generic GIS Layer Query ===============================
// =======================================================================

/**
 * Queries a GIS layer for attributes or geometry at a given (x,y).
 * @param {string} url - ArcGIS FeatureServer/MapServer query endpoint
 * @param {number} x - Longitude
 * @param {number} y - Latitude
 * @param {string|null} field - Attribute field to return, or null for presence check
 * @param {boolean} withGeometry - If true, return feature geometry
 * @returns {any|null} Attribute value, true, geometry object, or null
 */
export async function queryLayer(url, x, y, field, withGeometry = false) {
  try {
    if (!url) throw new Error("Layer URL is missing.");
    if (!x || !y) return null;

    const params = new URLSearchParams({
      f: "json",
      geometry: `${x},${y}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: field || "*",
      returnGeometry: withGeometry ? "true" : "false"
    });

    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) throw new Error(`Layer query failed: ${res.status}`);

    const data = await res.json();
    if (data.features?.length) {
      refreshPermission = true;
      if (withGeometry) return data.features[0].geometry;
      if (field) return data.features[0].attributes[field];
      return true;
    }
    return null;
  } catch (err) {
    console.error("queryLayer error:", err);
    alert("Error: Failed to query GIS layer.");
    return null;
  }
}

// =======================================================================
// =============== Specific GIS Queries =================================
// =======================================================================

/**
 * Query zone code from zoning layer.
 */
export async function queryZoneCode(x, y) {
  return await queryLayer(window.CONFIG?.ZONING_URL, x, y, "SYM_CODE");
  
}



/**
 * Query heritage zone presence.
 */
export async function queryHeritage(x, y) {
  return (await queryLayer(window.CONFIG?.HERITAGE_URL, x, y)) ? "Yes" : "No";
}

/**
 * Query bushfire prone status.
 */
export async function queryBushfire(x, y) {
  try {
    const category = await queryLayer(window.CONFIG?.BUSHFIRE_URL, x, y, "Category");

    if (category !== null && category >= 1) {
      return "Yes";
    }
    return "No";
  } catch (err) {
    console.error("queryBushfire error:", err);
    alert("Error: Failed to query bushfire prone zone.");
    return "No";
  }
}

/**
 * Query foreshore building line status.
 */
export async function queryForeshore(x, y) {
  return (await queryLayer(window.CONFIG?.FBL_URL, x, y, "MAP_TYPE")) ? "Yes" : "No";
}

/**
 * Query biodiversity values map.
 */
export async function queryBiodiversity(x, y) {
  return (await queryLayer(window.CONFIG?.BIODIVERSITY_URL, x, y, "BV_Category")) ? "Yes" : "No";
}

// =======================================================================
// =============== Boundary Query ========================================
// =======================================================================

/**
 * Queries lot boundary geometry and lot size from cadastral layer.
 * @param {number} x - Longitude
 * @param {number} y - Latitude
 * @returns {Object|null} {rings, lotSize, attributes} or null
 */
export async function queryBoundary(x, y) {
  try {
    if (!window.CONFIG?.FEATURESERVER_URL) {
      throw new Error("CONFIG.FEATURESERVER_URL is missing.");
    }

    const params = new URLSearchParams({
      f: "json",
      geometry: `${x},${y}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: "true"
    });

    const res = await fetch(`${window.CONFIG.FEATURESERVER_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`Boundary query failed: ${res.status}`);

    const data = await res.json();
    if (data.features?.length) {
      const feature = data.features[0];
      const rings = feature.geometry?.rings || null;
      const attrs = feature.attributes || {};

      let lotSize = null;

      //  Prefer explicit unit if available
      if (attrs.LOT_SIZE && attrs.LOT_SIZE_UOM) {
        const uom = attrs.LOT_SIZE_UOM.toLowerCase();
        if (uom.includes("ha")) {
          lotSize = parseFloat(attrs.LOT_SIZE) * 10000; // hectares → m²
        } else if (uom.includes("sqm") || uom.includes("m2")) {
          lotSize = parseFloat(attrs.LOT_SIZE); // already in m²
        }
      }
      //  If AREA_SQM exists, trust it
      else if (attrs.AREA_SQM) {
        lotSize = parseFloat(attrs.AREA_SQM);
      }
      // Otherwise fall back to Shape__Area (geometry-based)
      else if (attrs.Shape__Area) {
        lotSize = parseFloat(attrs.Shape__Area);
      }
      // Or some datasets use area_total
      else if (attrs.area_total) {
        lotSize = parseFloat(attrs.area_total);
      }

      // Final formatting
      if (lotSize) {
        lotSize = lotSize.toFixed(2); // always return as string with 2 decimals
      }

      return {
        rings,
        lotSize,
        attributes: attrs
      };
    }

    return null;
  } catch (err) {
    console.error("queryBoundary error:", err);
    alert("Error: Failed to query property boundary.");
    return null;
  }
}


// ========================== Autocomplete UI ==========================
document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById('address');


  let lastRefreshTime = 0;
    // Listen for backspace/delete keyup that results in empty input → refresh page
  input.addEventListener("keyup", (e) => {
    const valueNow = input.value.trim();

    
    const isTriggerKey = ["Backspace", "Delete", "Escape"].includes(e.key);

    if (!isTriggerKey) return;

    const now = Date.now();
    const timeSinceLast = now - lastRefreshTime;

    if (valueNow === "" &&refreshPermission) {
      refreshPermission = false;
      clearAllFields();

    }






  });


  // Enforce first character is A–Z, a–z or 0–9 (ignore anything else silently)
  input.addEventListener("keydown", (e) => {
  const cursorAtStart = input.selectionStart === 0;
  const noTextBefore = input.value.slice(0, input.selectionStart).trim() === "";

  if (cursorAtStart && noTextBefore) {
    const isValid = /^[a-zA-Z0-9]$/.test(e.key);
    const isControlKey = [
      "Backspace", "Tab", "ArrowLeft", "ArrowRight", "Delete"
    ].includes(e.key);

    if (!isValid && !isControlKey) {
      e.preventDefault();
    }
  }
});
  
  //
  // input.addEventListener("paste", (e) => {
  // const pastedText = (e.clipboardData || window.clipboardData).getData("text").trim();
  // if (!pastedText) return;

  // const oldValue = input.value.trim();

   
  // setTimeout(() => {
  //   const newValue = input.value.trim();

  //   const replacedAll = oldValue.length > 0 && newValue === pastedText;
  //   if (replacedAll && refreshPermission) {
  //     refreshPermission = false;
  //     sessionStorage.setItem("pendingAddressPaste", pastedText);

  //     console.log("Detected full replace paste, reloading...");
  //     clearAllFields();

  //     }
  //   }, 50);
  // });


  input.addEventListener("paste", (e) => {
  const pastedText = (e.clipboardData || window.clipboardData).getData("text").trim();
  if (!pastedText) return;

  const oldValue = input.value.trim();

  // Delay to allow browser to update input field first
  setTimeout(() => {
    const newValue = input.value.trim();
    const replacedAll = oldValue.length > 0 && newValue === pastedText;

    if (replacedAll && refreshPermission) {
      refreshPermission = false;
      console.log("Detected full replace paste, clearing and restoring pasted text...");

      // Temporarily store pasted text for restoration
      const savedText = pastedText;

      // Clear all fields first (this triggers resetForm)
      clearAllFields();

      // After clearAllFields finishes, restore the pasted address
      setTimeout(() => {
        const addr = document.getElementById("address");
        if (addr) {
          addr.value = savedText;
          addr.focus();
          // Optionally trigger autocomplete again
          fetchAndFilterAddresses(savedText);
        }
      }, 100);
    }
  }, 50);
});





  //  CUT event LISTENER
  input.addEventListener("cut", (e) => {
    const currentValue = input.value.trim();

    setTimeout(() => {
      const afterCut = input.value.trim();

      if (currentValue.length > 0 && afterCut === "") {
        sessionStorage.setItem("triggeredByCut", "true");
        if (refreshPermission) {
          refreshPermission = false;
          clearAllFields();

        }
      }
    }, 0);
  });







  const resultsDiv = document.getElementById('results');
  if (!input || !resultsDiv) return; 
  
  input.focus();


  
    // ================== Restore pasted address after refresh ==================
  const restored = sessionStorage.getItem("pendingAddressPaste");
  if (restored) {
    input.value = restored;
    sessionStorage.removeItem("pendingAddressPaste");

    // Keep cursor at end of pasted input
    input.setSelectionRange(input.value.length, input.value.length);

    // Trigger validation & suggestions
    fetchAndFilterAddresses(restored).then((suggestions) => {
      resultsDiv.innerHTML = '';

      suggestions.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = item.address;
        div.tabIndex = 0;

        div.onclick = () => selectAddress(item.address);
        div.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') selectAddress(item.address);
        });

        resultsDiv.appendChild(div);
      });
    }).catch((err) => {
      console.error("Autocomplete after paste failed:", err);
    });
  }


  // =============== Confirm Button Extra Listener ===============
  // NOTE: This runs ONLY when user manually clicks "Confirm".
 // It will NOT auto-trigger if address autocomplete fails.
  const confirmBtn = document.getElementById('confirm-address');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
      const address = input.value.trim();
      if (!address) {
        alert("Please enter an address before confirming.");
        return;
      }

      //  allow only one query at a time
      if (isQueryRunning) {
        alert("Please wait until the current address lookup completes.");
        return;
      }
      isQueryRunning = true;
      refreshPermission = false;

      try {
        const coords = await geocodeAddress(address);
        if (!coords) {
          alert("Geocoding failed. Please check the address.");
          return;
        }

        const { x, y } = coords;
        window.latestCoords = { x, y };

        // all GIS queries in parallel
        const [boundary, zone, heritage, foreshore, bushfireVal, esa] = await Promise.all([
          queryBoundary(x, y),
          queryZoneCode(x, y),
          queryHeritage(x, y),
          queryForeshore(x, y),
          queryBushfire(x, y),
          queryBiodiversity(x, y)
        ]);

        // Extract relevant values
        const lotSize = boundary?.lotSize || "";
        const heritageVal = (heritage || "no").toLowerCase();
        const foreshoreVal = (foreshore || "no").toLowerCase();
        const bushfireLower = (bushfireVal || "no").toLowerCase();
        const esaVal = (esa || "no").toLowerCase();

        // 
        refreshPermission = true;

        // --- Populate fields ---
        document.getElementById("zoning").value = zone || "";
        document.getElementById("heritage").value = heritageVal;
        document.getElementById("foreshore").value = foreshoreVal;
        document.getElementById("bushfire").value = bushfireLower;
        document.getElementById("sensitive_area").value = esaVal;
        document.getElementById("land_size").value = lotSize;

        console.log(" Confirm completed successfully:", { address, x, y, zone, heritageVal, foreshoreVal, bushfireLower, esaVal, lotSize });
      } catch (err) {
        console.error("Confirm address failed:", err);
        alert("Error confirming address. See console for details.");
      } finally {
        isQueryRunning = false;
      }
    });
  }




let selectedIndex = -1; // define globally once


let lastRenderedList = [];

// --- Input listener for address autocomplete ---
input.addEventListener('input', async () => {
  const query = input.value.trim();
  if (query.length < 3) {
    resultsDiv.innerHTML = '';
    lastRenderedList = [];
    return;
  }

  try {
    const suggestions = await fetchAndFilterAddresses(query);

    // Compare current list with last rendered one
    const newList = suggestions.map(s => s.address);
    const isSame =
      newList.length === lastRenderedList.length &&
      newList.every((v, i) => v === lastRenderedList[i]);

    if (isSame) return; // skip unnecessary redraws

    // Update the cache
    lastRenderedList = newList;

    // Use a document fragment to minimize reflow/repaint
    const frag = document.createDocumentFragment();
    for (const item of suggestions) {
      const div = document.createElement('div');
      div.className = 'item';
      div.textContent = item.address;
      div.tabIndex = 0;

      // Mouse click
      div.onclick = () => selectAddress(item.address);

      // Keyboard Enter on focused suggestion
      div.addEventListener('keydown', e => {
        if (e.key === 'Enter') selectAddress(item.address);
      });

      frag.appendChild(div);
    }

    // Replace old list only once
    // resultsDiv.innerHTML = '';
    // resultsDiv.appendChild(frag);
    window.requestAnimationFrame(() => {
      resultsDiv.innerHTML = '';
      resultsDiv.appendChild(frag);
    });
  } catch (err) {
    console.error('Autocomplete fetch failed:', err);
  }
});

// Keyboard navigation (Up/Down/Enter)
input.addEventListener('keydown', (event) => {
  const items = resultsDiv.querySelectorAll('.item');
  if (event.key === 'Escape') {       // Hide when Esc pressed
    // resultsDiv.innerHTML = '';
    // return;
    //  If dropdown list is visible → hide it
    if (resultsDiv.innerHTML.trim() !== '') {
      resultsDiv.innerHTML = '';
      return;
    }

    //  If dropdown is hidden but input has text → clear the address bar
    if (input.value.trim() !== '') {
      input.value = '';
      return;
    }

    // If both dropdown and address bar are empty → refresh home page
    if (refreshPermission) {
        refreshPermission = false;
        clearAllFields();

      }
    return;
  
  }

  if (!items.length) return;

  if (event.key === 'ArrowDown') {
    selectedIndex = (selectedIndex + 1) % items.length;
    updateSelection(items, selectedIndex);
  } else if (event.key === 'ArrowUp') {
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    updateSelection(items, selectedIndex);
  } else if (event.key === 'Enter' && selectedIndex >= 0) {
    event.preventDefault();
    items[selectedIndex].click();
  }
});

//  Hide list when user clicks back into input
input.addEventListener('focus', () => {
  resultsDiv.innerHTML = '';
});
// Hide listwhen user clicks in the address bar
input.addEventListener('click', () => {
  resultsDiv.innerHTML = '';
});


// Hide list when clicking anywhere outside input or results
document.addEventListener('click', (e) => {
  if (!resultsDiv.contains(e.target) && e.target !== input) {
    resultsDiv.innerHTML = '';
  }
});

function updateSelection(items, index) {
  items.forEach((el, i) => {
    el.classList.toggle('selected', i === index);
    if (i === index) el.scrollIntoView({ block: 'nearest' });
  });
}

async function selectAddress(address) {
  if (isQueryRunning) {
    alert("Please wait until the current lookup completes.");
    return;
  }
  isQueryRunning = true;
  refreshPermission = false;

  try {
    input.value = address;
    resultsDiv.innerHTML = '';
    const coords = await geocodeAddress(address);
    if (!coords) return;

    const { x, y } = coords;
    window.latestCoords = { x, y };

    // 
    const [boundary, zone, heritage, foreshore, bushfireVal, esa] = await Promise.all([
      queryBoundary(x, y),
      queryZoneCode(x, y),
      queryHeritage(x, y),
      queryForeshore(x, y),
      queryBushfire(x, y),
      queryBiodiversity(x, y)
    ]);

    const lotSize = boundary?.lotSize || "";
    const heritageVal = (heritage || "no").toLowerCase();
    const foreshoreVal = (foreshore || "no").toLowerCase();
    const bushfireLower = (bushfireVal || "no").toLowerCase();
    const esaVal = (esa || "no").toLowerCase();

    refreshPermission = true; // 

    document.getElementById("zoning").value = zone || "";
    document.getElementById("heritage").value = heritageVal;
    document.getElementById("foreshore").value = foreshoreVal;
    document.getElementById("bushfire").value = bushfireLower;
    document.getElementById("sensitive_area").value = esaVal;
    document.getElementById("land_size").value = lotSize;
  } catch (err) {
    console.error("selectAddress failed:", err);
  } finally {
    isQueryRunning = false; //
  }
}

// zoning input listener - auto-uppercase and validate
const zoningInput = document.getElementById("zoning");
if (zoningInput) {
  const validZones = [
  "R1", "R2", "R3", "R4", "R5",
  "RU1", "RU2", "RU3", "RU4", "RU5", "RU6",
  "E1", "E2", "E3", "E4", "E5",
  "MU1",
  "RE1", "RE2",
  "C1", "C2", "C3", "C4",
  "SP1", "SP2", "SP3", "SP4", "SP5",
  "IN1", "IN2",
  "B1", "B2", "B3", "B4", "B5", "B7",
  "W1", "W2", "W3", "W4"
];

  // auto-uppercase
  zoningInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.toUpperCase();
  });

  // Check validity
  zoningInput.addEventListener("blur", (e) => {
    const value = e.target.value.trim().toUpperCase();
    if (value && !validZones.includes(value)) {
      
      alert(`Please enter a valid zoning code consistent with the NSW planning scheme, such as R1, R3, RU5.`);
      e.target.value = "";
    }
  });
}


});



// ====== GENERIC MAP HELP FUNCTION ======
function setupHelpIcon(iconId, mapUrl, mapName, zoomLevel = 19) {
  document.addEventListener("DOMContentLoaded", function () {
    const icon = document.getElementById(iconId);

    if (icon) {
      icon.addEventListener("click", function () {
        const coords = window.latestCoords;
        if (coords && coords.x && coords.y) {
          const lon = coords.x;
          const lat = coords.y;
          const fullUrl = `${mapUrl}&center=${lon},${lat}&level=${zoomLevel}&marker=${lon},${lat}`;
          window.open(fullUrl, "_blank");
        } else {
          alert(`Please confirm an address first to view the ${mapName} map.`);
        }
      });
    }
  });
}

/**
 * Clears all input fields, cached data, and global variables,
 * and safely triggers the "New Assessment" button click to restore UI state.
 * This ensures a consistent reset behavior between manual and automatic resets.
 */
function clearAllFields() {
  console.log("Executing clearAllFields: triggering New Assessment reset");

  // Trigger the same logic as clicking the "New Assessment" button (id="reset")
  const newAssessmentBtn = document.getElementById("reset");
  if (newAssessmentBtn) {
    newAssessmentBtn.click(); // Calls resetForm() indirectly from app.js
  } else {
    console.warn("Reset button not found; UI reset skipped.");
  }

  // Clear all temporary and global states
  sessionStorage.removeItem("pendingAddressPaste");
  sessionStorage.removeItem("triggeredByCut");
  window.latestCoords = null;
  refreshPermission = false;
  isQueryRunning = false;

  // Clear output and result containers
  const resultsDiv = document.getElementById("results");
  if (resultsDiv) resultsDiv.innerHTML = "";
  const resultPre = document.getElementById("result");
  if (resultPre) resultPre.innerHTML = "";

  // Smoothly scroll back to top for better user experience
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Delay refocus to ensure UI reset has finished rendering
  setTimeout(() => {
    const addr = document.getElementById("address");
    if (addr) addr.focus();
  }, 50);
}

// Expose to global scope for reuse and debugging from console or other scripts
window.clearAllFields = clearAllFields;


// ====== GENERIC MAP HELP ICON SETUP ======
setupHelpIcon("zoning-help", window.CONFIG.ZONING_MAP, "zoning", 16);
setupHelpIcon("sensitive-area-help", window.CONFIG.SENSITIVE_MAP, "sensitive area", 19);
setupHelpIcon("lot-size-help", window.CONFIG.LOTSIZE_MAP, "lot size", 19);
setupHelpIcon("heritage-help", window.CONFIG.HERITAGE_MAP, "heritage", 19);
setupHelpIcon("bushfire-help", window.CONFIG.BUSHFIRE_MAP, "Bushfire Prone Land", 16);