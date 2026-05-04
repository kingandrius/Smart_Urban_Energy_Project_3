// 1. Initialize the Chart first (so it's ready to receive data)
const ctx = document.getElementById('weatherChart').getContext('2d');
const myChart = new Chart(ctx, {
    type: 'bar',
    data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        datasets: [{
            label: 'Energy Usage (kWh)',
            data: [12, 19, 3, 5, 2],
            backgroundColor: '#00ffcc'
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true, grid: { color: '#333' } },
            x: { grid: { color: '#333' } }
        },
        plugins: {
            legend: { labels: { color: 'white' } }
        }
    }
});

// 2. The function to grab weather data
async function updateDashboard() {
    try {
        const response = await fetch('http://localhost:3000/weather');
        const data = await response.json();

        if (data.city) {
            document.getElementById('temp').innerText = `${Math.round(data.temp)}°C`;
            document.getElementById('wind').innerText = `${data.wind_speed} m/s`;
            document.getElementById('status').innerText = data.condition;
            console.log("Dashboard updated!");
        }
    } catch (err) {
        console.log("Couldnt grab data:", err);
    }
}

// 3. Kick off the weather update
updateDashboard();