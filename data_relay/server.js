const express = require('express');
const cors = require('cors'); // let the browser talk to the server
const fs = require('fs');     // added to read the json file
const path = require('path');   // added to handle folder paths
const app = express();
const PORT = 3000;

// 1. house rules
app.use(cors()); // security handshake for the frontend
app.use(express.json());

// tell node to show the website files from the dashboard folder
app.use(express.static(path.join(__dirname, '../dashboard')));

// we now initialize this as an empty array to match our T+3 forecast logic
let latestLiveForecast = [];

// 2. the actual endpoints

// check if the relay is even alive
app.get('/status', (req, res) => {
    res.send('Data Relay is up and running!');
});

// the historical archive: grab the 31-day analysis from the logic_engine
app.get('/weather', (req, res) => {
    const dataPath = path.join(__dirname, '../logic_engine/march_analysis.json');

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Couldn't find the json file:", err);
            return res.status(404).json({ error: "Analysis file missing" });
        }
        res.json(JSON.parse(data));
    });
});

// the live strategic route: serves the 4-point forecast to the frontend
app.get('/live-weather', (req, res) => {
    // if we haven't received data yet, send a dummy array so the frontend doesn't crash
    if (latestLiveForecast.length === 0) {
        return res.json([
            { hour: "Now", temp: 0, wind: 0, score: 0 },
            { hour: "+1h", temp: 0, wind: 0, score: 0 },
            { hour: "+2h", temp: 0, wind: 0, score: 0 },
            { hour: "+3h", temp: 0, wind: 0, score: 0 }
        ]);
    }
    res.json(latestLiveForecast);
});

// where tier 1 (python) dumps the fresh T+3 forecast data
app.post('/update-weather', (req, res) => {
    // python is now sending an array [{}, {}, {}, {}]
    latestLiveForecast = req.body;

    console.log('Strategy updated! T+3 window received from Tier 1.');

    // send a thumbs up back to python
    res.status(200).json({ message: 'Forecast received by the relay!' });
});

// 3. fire it up
app.listen(PORT, () => {
    console.log(`Relay server working on http://localhost:${PORT}`);
});