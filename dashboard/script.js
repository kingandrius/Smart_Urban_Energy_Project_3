// 1. march baseline data (mapped from your original usage)
const marchLabels = Array.from({length: 31}, (_, i) => i + 1); // days 1 to 31
const marchUsageData = [
    11, 6, 10, 17, 19, 18, 22, 9, 15, 18,
    16, 12, 16, 23, 5, 14, 12, 4, 5, 20,
    15, 3, 3, 5, 15, 17, 17, 16, 13, 14, 15
];

// 2. initialize the chart with dual axes (y for kWh, y1 for Score)
const ctx = document.getElementById('weatherChart').getContext('2d');
const myChart = new Chart(ctx, {
    data: {
        labels: marchLabels,
        datasets: [
            {
                type: 'bar',
                label: 'March Actual Usage (kWh)',
                data: marchUsageData,
                backgroundColor: 'rgba(255, 165, 0, 0.6)',
                borderColor: 'orange',
                borderWidth: 1,
                yAxisID: 'y', // maps to the left axis
                order: 2
            },
            {
                type: 'line',
                label: 'Optimizer Trigger Score',
                data: [], // filled by the relay
                borderColor: '#00ffcc',
                backgroundColor: '#00ffcc',
                borderWidth: 2,
                pointRadius: 3,
                tension: 0.3,
                yAxisID: 'y1', // maps to the right axis
                order: 1
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: { display: true, text: 'Energy Usage (kWh)', color: 'orange' },
                grid: { color: '#333' }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                beginAtZero: true,
                title: { display: true, text: 'Optimizer Score', color: '#00ffcc' },
                grid: { drawOnChartArea: false } // prevents messy double grid lines
            },
            x: {
                title: { display: true, text: 'Day of March', color: '#888' },
                grid: { display: false }
            }
        },
        plugins: {
            legend: { labels: { color: 'white' } }
        }
    }
});

// 3. grab data from our node.js relay (tier 2)
async function updateDashboard() {
    try {
        // --- Part A: Update the Graph with 31-day data ---
        const graphResponse = await fetch('http://localhost:3000/weather');
        const graphData = await graphResponse.json();

        if (Array.isArray(graphData)) {
            const scores = graphData.map(day => day.trigger_score);
            myChart.data.datasets[1].data = scores;
            myChart.update();
            console.log("graph line updated with analysis data");
        }

        // --- Part B: Update the Top Card with Live Python data ---
        const liveResponse = await fetch('http://localhost:3000/live-weather');
        const liveData = await liveResponse.json();

        if (liveData.city) {
            // updates the title to maastricht
            document.querySelector('h1').innerText = `${liveData.city} Weather`;

            // update the live stats
            document.getElementById('temp').innerText = `${Math.round(liveData.temp)}°C`;
            document.getElementById('wind').innerText = `${liveData.wind_speed} m/s`;
            document.getElementById('status').innerText = liveData.condition;

            // the logic for the "system standby" vs "preheating" badge
            const badge = document.getElementById('optimizer-status');

            if (liveData.preheat_status === true) {
                badge.innerText = "OPTIMIZER ACTIVE: PREHEATING";
                badge.className = "status-badge active";
            } else {
                badge.innerText = liveData.status; // will show "SYSTEM ACTIVE"
                badge.className = "status-badge active";
            }

            console.log("dashboard updated with live trigger:", liveData.trigger_value);
        }
    } catch (err) {
        console.log("couldnt grab data from relay:", err);
    }
}

// 4. run the update on page load
updateDashboard();