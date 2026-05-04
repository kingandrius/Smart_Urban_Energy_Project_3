// 1. march baseline labels (1 to 31)
const marchLabels = Array.from({length: 31}, (_, i) => i + 1);

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
// this fixes the "unclickable" issue by toggling the 'hidden' class
function switchTab(tabName) {
    const liveSec = document.getElementById('live-section');
    const histSec = document.getElementById('historical-section');
    const liveBtn = document.getElementById('tab-live');
    const histBtn = document.getElementById('tab-history');

    if (tabName === 'history') {
        // show the archive, hide the live placeholder
        histSec.classList.remove('hidden');
        liveSec.classList.add('hidden');

        // swap the glowing border on the buttons
        histBtn.classList.add('active-tab');
        liveBtn.classList.remove('active-tab');

        // tell chart.js to redraw so it doesn't look squished
        myChart.resize();
    } else {
        // back to the live monitor
        histSec.classList.add('hidden');
        liveSec.classList.remove('hidden');

        liveBtn.classList.add('active-tab');
        histBtn.classList.remove('active-tab');
    }
}

// 4. the main data engine
async function updateDashboard() {
    try {
        // fetching the processed march data from the node relay
        const graphResponse = await fetch('http://localhost:3000/weather');
        const graphData = await graphResponse.json();

        if (Array.isArray(graphData)) {
            myChart.data.datasets[1].data = graphData.map(day => day.trigger_score);
            myChart.update();

            let totalActual = 0;
            let totalSmart = 0;

            graphData.forEach(day => {
                totalActual += day.actual_cost;
                totalSmart += day.optimized_cost;
            });

            const totalSaved = totalActual - totalSmart;

            document.getElementById('actual-bill').innerText = `€${totalActual.toFixed(2)}`;
            document.getElementById('smart-bill').innerText = `€${totalSmart.toFixed(2)}`;
            document.getElementById('total-saved').innerText = `€${totalSaved.toFixed(2)}`;
        }

        // grab the current live maastricht data
        const liveResponse = await fetch('http://localhost:3000/live-weather');
        const liveData = await liveResponse.json();

        if (liveData.city) {
            document.getElementById('city-name').innerText = `${liveData.city} Weather`;
            document.getElementById('temp').innerText = `${Math.round(liveData.temp)}°C`;
            document.getElementById('wind').innerText = `${liveData.wind_speed} m/s`;

            const badge = document.getElementById('optimizer-status');

            if (liveData.preheat_status === true) {
                badge.innerText = "OPTIMIZER ACTIVE: PREHEATING";
                badge.classList.add('active-glow');
            } else {
                badge.innerText = "SYSTEM ACTIVE";
                badge.classList.add('active-glow');
            }
        }
    } catch (err) {
        console.log("relay connection failed:", err);
    }
}

// 5. boot it up
updateDashboard();