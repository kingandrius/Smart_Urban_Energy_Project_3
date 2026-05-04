// 1. march baseline labels (1 to 31)
const marchLabels = Array.from({length: 31}, (_, i) => i + 1);
const THRESHOLD = 30; // matches the aggressive python logic we pushed

// 2. initialize the chart (Dual Axis: kWh on Left, Score on Right)
const ctx = document.getElementById('weatherChart').getContext('2d');
const myChart = new Chart(ctx, {
    data: {
        labels: marchLabels,
        datasets: [
            {
                type: 'bar',
                label: 'March Actual Usage (kWh)',
                data: [11, 6, 10, 17, 19, 18, 22, 9, 15, 18, 16, 12, 16, 23, 5, 14, 12, 4, 5, 20, 15, 3, 3, 5, 15, 17, 17, 16, 13, 14, 15],
                backgroundColor: 'rgba(255, 165, 0, 0.4)',
                borderColor: 'orange',
                borderWidth: 1,
                yAxisID: 'y',
                order: 2
            },
            {
                type: 'line',
                label: 'Optimizer Trigger Score',
                data: [], // filled by march_analysis.json
                borderColor: '#00ffcc',
                backgroundColor: '#00ffcc',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3,
                yAxisID: 'y1',
                order: 1
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                type: 'linear', position: 'left', beginAtZero: true,
                title: { display: true, text: 'Energy Usage (kWh)', color: 'orange' },
                grid: { color: '#333' }
            },
            y1: {
                type: 'linear', position: 'right', beginAtZero: true,
                title: { display: true, text: 'Optimizer Score', color: '#00ffcc' },
                grid: { drawOnChartArea: false }
            },
            x: { grid: { display: false }, ticks: { color: '#888' } }
        },
        plugins: { legend: { labels: { color: 'white' } } }
    }
});

// 3. the tab switcher logic
// handles the toggle between live strategic view and historical backtesting
function switchTab(tabName) {
    const liveSec = document.getElementById('live-section');
    const histSec = document.getElementById('historical-section');
    const liveBtn = document.getElementById('tab-live');
    const histBtn = document.getElementById('tab-history');

    if (tabName === 'history') {
        histSec.classList.remove('hidden');
        liveSec.classList.add('hidden');
        histBtn.classList.add('active-tab');
        liveBtn.classList.remove('active-tab');

        myChart.resize(); // force chart to fit container
        updateHistoricalData();
    } else {
        histSec.classList.add('hidden');
        liveSec.classList.remove('hidden');
        liveBtn.classList.add('active-tab');
        histBtn.classList.remove('active-tab');

        updateLiveForecast();
    }
}

// 4. historical engine
// fetches march data to show the potential savings lab
async function updateHistoricalData() {
    try {
        const response = await fetch('http://localhost:3000/weather');
        const graphData = await response.json();

        if (Array.isArray(graphData)) {
            myChart.data.datasets[1].data = graphData.map(day => day.trigger_score);
            myChart.update();

            let totalActual = 0;
            let totalSmart = 0;
            graphData.forEach(day => {
                totalActual += day.actual_cost;
                totalSmart += day.optimized_cost;
            });

            document.getElementById('actual-bill').innerText = `€${totalActual.toFixed(2)}`;
            document.getElementById('smart-bill').innerText = `€${totalSmart.toFixed(2)}`;
            document.getElementById('total-saved').innerText = `€${(totalActual - totalSmart).toFixed(2)}`;
        }
    } catch (err) {
        console.log("historical relay failed:", err);
    }
}

// 5. live strategic engine
// handles the T+3 forecast cards and the preheating logic
async function updateLiveForecast() {
    try {
        const response = await fetch('http://localhost:3000/live-weather');
        const forecastData = await response.json(); // now expecting the 4-point array

        const container = document.getElementById('forecast-row');
        const strategyLabel = document.getElementById('strategy-label');
        const statusBadge = document.getElementById('optimizer-status');

        container.innerHTML = '';
        let preheatNeeded = false;

        forecastData.forEach((point, index) => {
            const isAlert = point.score > THRESHOLD;
            if (isAlert) preheatNeeded = true;

            // update the main top card using the "Now" data
            if (index === 0) {
                document.getElementById('temp').innerText = `${Math.round(point.temp)}°C`;
                document.getElementById('wind').innerText = `${point.wind} m/s`;
            }

            // build the individual forecast cards
            const card = document.createElement('div');
            card.className = `forecast-card ${isAlert ? 'trigger-warning' : ''}`;
            card.innerHTML = `
                <p style="color: #666; font-size: 0.7rem; margin: 0 0 10px 0; text-transform: uppercase;">
                    ${index === 0 ? 'Now' : '+' + index + 'h'}
                </p>
                <span style="font-size: 1.4rem; font-weight: bold; display: block;">${point.temp}°C</span>
                <span style="color: #888; font-size: 0.8rem;">${point.wind} m/s</span>
                <div style="margin-top: 15px; border-top: 1px solid #333; padding-top: 10px;">
                    <span class="score-text" style="font-size: 0.9rem; font-weight: bold; color: #00ffcc;">${point.score}</span>
                    <p style="font-size: 0.6rem; color: #555; margin: 2px 0 0 0;">SCORE</p>
                </div>
            `;
            container.appendChild(card);
        });

        // final analysis for the strategy box and status badge
        if (preheatNeeded) {
            statusBadge.innerText = "OPTIMIZER ACTIVE: PREHEATING";
            statusBadge.classList.add('active-glow');
            strategyLabel.innerText = "STRATEGY: Incoming weather stress detected in T+3 window. Preheating authorized.";
            strategyLabel.style.color = "#ffaa00";
        } else {
            statusBadge.innerText = "SYSTEM ACTIVE";
            statusBadge.classList.remove('active-glow');
            strategyLabel.innerText = "STRATEGY: Weather stable. No preheating required for the current window.";
            strategyLabel.style.color = "#00ffcc";
        }

    } catch (err) {
        console.log("live forecast relay failed:", err);
        document.getElementById('forecast-row').innerHTML = '<p style="color: #444;">Relay connection lost...</p>';
    }
}

// 6. boot it up
window.onload = () => {
    switchTab('live'); // start the user on the live monitor
};