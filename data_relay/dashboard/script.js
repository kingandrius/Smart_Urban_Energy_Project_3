let weatherChart;

async function fetchHistoricalData(month = 'march') {
    const label = document.getElementById('month-label');
    if (label) label.innerText = month.charAt(0).toUpperCase() + month.slice(1);

    try {
        // REMOVED http://localhost:3000 - Azure will handle the domain automatically
        const response = await fetch(`/weather?month=${month}`);
        const data = await response.json();

        const totalActual = data.reduce((sum, day) => sum + (day.actual_cost || 0), 0);
        const totalOptimized = data.reduce((sum, day) => sum + (day.optimized_cost || 0), 0);
        const savings = (totalActual - totalOptimized).toFixed(2);

        document.getElementById('total-savings').innerText = `€${savings}`;
        updateChart(data, month);
    } catch (err) { console.error("Historical fetch error:", err); }
}

async function fetchLiveWeather() {
    const city = document.getElementById('cityInput').value.trim() || 'Maastricht';
    const resultDiv = document.getElementById('liveResult');
    resultDiv.innerHTML = `<p>🔄 Querying Engine...</p>`;

    try {
        // REMOVED http://localhost:3000
        const response = await fetch(`/live-weather?city=${city}`);
        const data = await response.json();

        resultDiv.innerHTML = `
            <div style="margin-bottom:8px;"><strong>City:</strong> ${data.city}</div>
            <div style="margin-bottom:8px;"><strong>Environment:</strong> ${data.temperature}°C / ${data.wind_speed} m/s</div>
            <div style="margin-bottom:8px;"><strong>Conditions:</strong> ${data.conditions}</div>
            <div style="margin-bottom:8px;"><strong>Opt. Index:</strong> <span class="index-bubble">${data.opt_index}</span></div>
            <div class="recommendation-box">
                Recommendation: ${data.recommendation}
            </div>
        `;
    } catch (err) { resultDiv.innerHTML = `<p style="color:red">Engine communication failed.</p>`; }
}

function updateChart(data, monthName) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    if (weatherChart) weatherChart.destroy();
    weatherChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(entry => entry.timestamp.slice(8, 10)),
            datasets: [
                { label: 'Actual Cost (€)', data: data.map(e => e.actual_cost), backgroundColor: '#ff6384' },
                { label: 'Optimized Cost (€)', data: data.map(e => e.optimized_cost), backgroundColor: '#4bc0c0' }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function changeMonth(month) { fetchHistoricalData(month); }
window.onload = () => fetchHistoricalData('march');