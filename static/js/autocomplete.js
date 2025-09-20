const input = document.getElementById('address');
const resultsDiv = document.getElementById('results');

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
      .filter(item => item.address.endsWith("2640") || item.address.endsWith("2641"))
      .forEach(item => {
        const div = document.createElement('div');
        div.className = 'item';
        div.textContent = item.address;

        div.onclick = () => {
          input.value = item.address;
          resultsDiv.innerHTML = '';
        };

        resultsDiv.appendChild(div);
      });
  } catch (err) {
    console.error("Fetch failed", err);
  }
});
