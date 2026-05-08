// ===== THEME TOGGLE =====
let weatherChart;

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme-preference');
    
    let theme = 'light';
    
    if (savedTheme) {
        theme = savedTheme;
    } else {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            theme = 'dark';
        }
    }
    
    applyTheme(theme);
}

function applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    } else {
        html.removeAttribute('data-theme');
    }
    
    localStorage.setItem('theme-preference', theme);
    updateThemeButton(theme);
    updateChartColors(theme);
}

function updateThemeButton(theme) {
    const button = document.getElementById('themeToggle');
    if (button) {
        button.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(newTheme);
}

if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme-preference')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

function updateChartColors(theme) {
    if (weatherChart) {
        const textColor = theme === 'dark' ? '#e0e0e0' : '#333';
        const gridColor = theme === 'dark' ? '#444' : '#e0e0e0';
        
        weatherChart.options.plugins.legend.labels.color = textColor;
        weatherChart.options.scales.y.ticks.color = textColor;
        weatherChart.options.scales.x.ticks.color = textColor;
        weatherChart.options.scales.y.grid.color = gridColor;
        weatherChart.options.scales.x.grid.color = gridColor;
        
        weatherChart.update();
    }
}

// ===== END THEME TOGGLE =====

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
        // call the local relay route and get back real weather data
        const response = await fetch(`/live-weather?city=${city}`);
        if (!response.ok) throw new Error('live-weather request failed');
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
    } catch (err) {
        console.error('live weather error', err);
        resultDiv.innerHTML = `<p style="color:red">Engine communication failed.</p>`;
    }
}

function updateChart(data, monthName) {
    const ctx = document.getElementById('weatherChart').getContext('2d');
    if (weatherChart) weatherChart.destroy();
    
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDark ? '#e0e0e0' : '#333';
    const gridColor = isDark ? '#444' : '#e0e0e0';
    
    weatherChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(entry => entry.timestamp.slice(8, 10)),
            datasets: [
                { label: 'Actual Cost (€)', data: data.map(e => e.actual_cost), backgroundColor: '#ff6384' },
                { label: 'Optimized Cost (€)', data: data.map(e => e.optimized_cost), backgroundColor: '#4bc0c0' }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: textColor }
                },
                title: {
                    display: true,
                    text: 'Daily Energy Cost Comparison',
                    color: textColor,
                    font: { size: 18 }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Cost (€)',
                        color: textColor,
                        font: { size: 14 }
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Day of Month',
                        color: textColor,
                        font: { size: 14 }
                    },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            }
        }
    });
}

function changeMonth(month) { fetchHistoricalData(month); }

window.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    fetchHistoricalData('march');
});