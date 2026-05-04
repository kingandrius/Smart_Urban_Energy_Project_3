// grab the data from our node.js relay
async function updateDashboard() {
    try {
        // asking the relay for the latest data python sent
        const response = await fetch('http://localhost:3000/weather');
        const data = await response.json();

        // if the data exists, put it on the screen
        if (data.city) {
            document.getElementById('temp').innerText = `${Math.round(data.temp)}°C`;
            document.getElementById('wind').innerText = `${data.wind_speed} m/s`;
            document.getElementById('status').innerText = data.condition;
            console.log("Dashboard updated with fresh data!");
        }
    } catch (err) {
        console.log("Couldnt grab data from relay:", err);
    }
}

// run it as soon as the page loads
updateDashboard();

// bonus: refresh the data every 30 seconds
setInterval(updateDashboard, 30000);