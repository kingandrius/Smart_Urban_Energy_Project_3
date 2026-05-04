// 1. configuration & baseline data
const RELAY_URL = 'http://localhost:3000/live-weather';
const ARCHIVE_URL = 'http://localhost:3000/weather';
const THRESHOLD = 30; // the aggressive trigger from our march backtest
const marchLabels = Array.from({length: 31}, (_, i) => i + 1);

let myChart; // global holder for the chart.js instance

// 2. the tab switcher logic
// handles the toggle between live strategic view and historical backtesting
function switchTab(tabName) {
    const liveSec = document.getElementById('live-section');
    const histSec = document.getElementById('historical-section');
    const liveBtn = document.getElementById('tab-live');
    const histBtn = document.getElementById('tab-history');

    if (!liveSec || !histSec) return;

    if (tabName === 'history') {
        histSec.classList.remove('hidden');
        liveSec.classList.add('hidden');
        if (histBtn) histBtn.classList.add('active-tab');
        if (liveBtn) liveBtn.classList.remove('active-tab');

        if (myChart) {
            myChart.resize();
            updateHistoricalData();
        }
    } else {
        histSec.classList.add('hidden');
        liveSec.classList.remove('hidden');
        if (liveBtn) liveBtn.classList.add('active-tab');
        if (histBtn) histBtn.classList.remove('active-tab');

        updateLiveForecast();
    }
}

// 3. live strategic engine
// handles the T+3 forecast cards and the predictive preheating logic
async function updateLiveForecast() {
    try {
        const response = await fetch(RELAY_URL);
        const forecastData = await response.json();

        const container = document.getElementById('forecast-row');
        const strategyLabel = document.getElementById('strategy-label');
        const statusBadge = document.getElementById('optimizer-status');

        if (!container) return;

        container.innerHTML = '';
        let preheatNeeded = false;

        forecastData.forEach((point, index) => {
            const isAlert = point.score > THRESHOLD;
            if (isAlert) preheatNeeded = true;

            if (index === 0) {
                const tempEl = document.getElementById('temp');
                const windEl = document.getElementById('wind');
                if (tempEl) tempEl.innerText = `${Math.round(point.temp)}°C`;
                if (windEl) windEl.innerText = `${point.wind} m/s`;
            }

            const label = index === 0 ? 'Now' : `+${index * 3}h`;

            const card = document.createElement('div');
            card.className = `forecast-card ${isAlert ? 'trigger-warning' : ''}`;
            card.innerHTML = `
                <p style="color: var(--text-dim); font-size: 0.7rem; margin: 0 0 10px 0; text-transform: uppercase;">${label}</p>
                <span style="font-size: 1.4rem; font-weight: bold; display: block;">${point.temp}°C</span>
                <span style="color: var(--text-dim); font-size: 0.8rem;">${point.wind} m/s</span>
                <div style="margin-top: 15px; border-top: 1px solid var(--border-color); padding-top: 10px;">
                    <span class="score-text" style="font-size: 0.9rem; font-weight: bold; color: ${isAlert ? 'orange' : 'var(--accent-color)'};">${point.score}</span>
                    <p style="font-size: 0.6rem; color: var(--text-dim); margin: 2px 0 0 0;">SCORE</p>
                </div>
            `;
            container.appendChild(card);
        });

        if (statusBadge && strategyLabel) {
            if (preheatNeeded) {
                statusBadge.innerText = "OPTIMIZER ACTIVE: PREHEATING";
                statusBadge.classList.add('active-glow');
                strategyLabel.innerText = "STRATEGY: Incoming weather stress detected in T+3 window. Preheating authorized.";
                strategyLabel.style.color = "#ffaa00";
            } else {
                statusBadge.innerText = "SYSTEM ACTIVE";
                statusBadge.classList.remove('active-glow');
                strategyLabel.innerText = "STRATEGY: Weather stable. No preheating required for the current window.";
                strategyLabel.style.color = "var(--accent-color)";
            }
        }

    } catch (err) {
        console.log("live forecast relay failed:", err);
        const container = document.getElementById('forecast-row');
        if (container) container.innerHTML = '<p style="color: var(--text-dim);">Awaiting data stream...</p>';
    }
}

// 4. historical engine
// fetches march data to show the potential savings lab
async function updateHistoricalData() {
    try {
        const response = await fetch(ARCHIVE_URL);
        const graphData = await response.json();

        if (Array.isArray(graphData) && myChart) {
            myChart.data.datasets[1].data = graphData.map(day => day.trigger_score);

            // update chart colors based on current theme for readability
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            myChart.options.scales.x.ticks.color = isLight ? '#555' : '#888';
            myChart.options.scales.y.ticks.color = isLight ? '#555' : '#888';
            myChart.options.plugins.legend.labels.color = isLight ? '#1a1a1a' : 'white';

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

// 5. theme toggle engine
// handles the switch between dark and light modes via css variables
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('selected-theme', newTheme);

        // refresh chart if visible to update label colors
        if (myChart) updateHistoricalData();
    });

    // check for saved preference
    const savedTheme = localStorage.getItem('selected-theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// 6. boot up logic
// initializes chart and starts the user on the live monitor
window.onload = () => {
    initTheme(); // initialize theme engine first

    const chartCanvas = document.getElementById('weatherChart');
    if (chartCanvas) {
        const ctx = chartCanvas.getContext('2d');
        myChart = new Chart(ctx, {
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
                        data: [],
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
                    y: { type: 'linear', position: 'left', beginAtZero: true },
                    y1: { type: 'linear', position: 'right', beginAtZero: true },
                    x: { ticks: { color: '#888' } }
                },
                plugins: { legend: { labels: { color: 'white' } } }
            }
        });
    }

    switchTab('live');
    setInterval(updateLiveForecast, 60000);
};