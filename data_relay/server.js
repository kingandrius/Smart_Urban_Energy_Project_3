const express = require('express');
const cors = require('cors'); // let the browser talk to the server
const fs = require('fs');     // added to read the json file
const path = require('path');   // added to handle folder paths
const app = express();
const PORT = 3000;

// 1. house rules
app.use(cors()); // security handshake for the frontend
app.use(express.json());

// this is the big one: tell node to actually show the website files from the dashboard folder
app.use(express.static(path.join(__dirname, '../dashboard')));

// a little spot in memory to hold the current weather so the dashboard doesn't stay on standby
let latestLiveWeather = {
    status: "SYSTEM STANDBY",
    temp: "--",
    wind_speed: "--",
    condition: "--"
};

// 2. the actual endpoints

// check if the relay is even alive
app.get('/status', (req, res) => {
    res.send('Data Relay is up and running!');
});

// the big one for the graph: grab the 31-day analysis we crunched in python
app.get('/weather', (req, res) => {
    // reaching up and over to the logic_engine folder for the goods
    const dataPath = path.join(__dirname, '../logic_engine/march_analysis.json');

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error("Couldn't find the json file. Did you run the python script?", err);
            return res.status(404).json({ error: "Analysis file missing" });
        }
        // turn the file text back into json and send it to the frontend
        res.json(JSON.parse(data));
    });
});

// this fills in those dashes in the top card on the website
app.get('/live-weather', (req, res) => {
    res.json(latestLiveWeather);
});

// where tier 1 (python) dumps the fresh weather data
app.post('/update-weather', (req, res) => {
    // spread the new data in and flip the switch to active
    latestLiveWeather = {
        ...req.body,
        status: "SYSTEM ACTIVE"
    };
    console.log('Just got new live data from Tier 1:', latestLiveWeather);

    // send a thumbs up back to python
    res.status(200).json({ message: 'Data received by the relay!' });
});

// 3. fire it up
app.listen(PORT, () => {
    console.log(`Relay server working on http://localhost:${PORT}`);
    console.log(`Go here to see the actual dashboard: http://localhost:${PORT}`);
});