const input = document.getElementById('address');
const resultsDiv = document.getElementById('results');

// --- Configurable list of allowed postcodes ---
const PostCodes = ["2640", "2641", "3691"];

// --- Fetch property info from backend ---
async function fetchPropertyInfo(address) {
  try {
    const response = await fetch("/address-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address })
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error:", data.error);
      return;
    }

    // Populate form fields
    if (data.zoning) document.getElementById("zoning").value = data.zoning;
    if (data.heritage) document.getElementById("heritage").value = data.heritage.toLowerCase();
    if (data.bushfire) document.getElementById("bushfire").value = data.bushfire.toLowerCase();
    if (data.sensitive_area) document.getElementById("sensitive_area").value = data.sensitive_area.toLowerCase();
    if (data.land_size) document.getElementById("land_size").value = data.land_size;

  } catch (err) {
    console.error("Fetch to backend failed", err);
  }
}

// --- Autocomplete handler ---
input.addEventListener('input', async () => {
  const query = input.value.trim();
  resultsDiv.innerHTML = '';

  if (query.length < 3) return;

  const url = `https://api.apps1.nsw.gov.au/planning/viewersf/V1/ePlanningApi/address?a=${encodeURIComponent(query)}&noOfRecords=5`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("API error " + response.status);

    const data = await response.json();

    data
      .filter(item => PostCodes.some(pc => item.address.endsWith(pc)))
      .forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = item.address;

        div.onclick = () => {
          input.value = item.address;
          resultsDiv.innerHTML = '';
          fetchPropertyInfo(item.address); // fetch attributes immediately
        };

        resultsDiv.appendChild(div);
      });
  } catch (err) {
    console.error("Autocomplete fetch failed", err);
  }
});
