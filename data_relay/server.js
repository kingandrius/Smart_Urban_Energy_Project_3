const express = require('express');
const cors = require('cors'); // let the browser talk to the server
const fs = require('fs');     // added to read the json file
const path = require('path');   // added to handle folder paths
const { spawn } = require('child_process'); // engine for triggering python on the fly
const app = express();
const PORT = 3000;

// 1. house rules
app.use(cors()); // security handshake for the frontend
app.use(express.json());

// tell node to show the website files from the dashboard folder
app.use(express.static(path.join(__dirname, '../dashboard')));

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

// the live strategic route: now actively triggers python for city switching
app.get('/live-weather', (req, res) => {
    // grab city from frontend query (e.g., ?city=London). defaults to maastricht.
    const city = req.query.city || 'Maastricht';

    console.log(`Frontend requested data for: ${city}`);

    // trigger tier 1 (python) and pass the city as a command line argument
    // note: updated filename to live_weather.py based on your folder structure
    const pythonProcess = spawn('python', [
        path.join(__dirname, '../logic_engine/live_weather.py'),
        city
    ]);

    let dataString = '';
    let errorString = '';

    // collect chunks of data coming from python's print statements
    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    // CRITICAL: catch errors (like missing libraries or api key issues)
    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    // once python finishes, parse the output and send it back to the dashboard
    pythonProcess.on('close', (code) => {
        if (errorString) {
            console.error(`Python Logic Error: ${errorString}`);
        }

        try {
            if (dataString) {
                const parsedData = JSON.parse(dataString);
                res.json(parsedData);
            } else {
                console.error("Python returned no data. Check for errors above.");
                res.status(500).json({ error: "No data received from logic engine" });
            }
        } catch (e) {
            console.error("Failed to parse Python output:", dataString);
            res.status(500).json({ error: "Invalid data format from script" });
        }
    });
});

// legacy endpoint: where python used to dump data (kept for safety)
app.post('/update-weather', (req, res) => {
    console.log('Post received! Note: System is moving toward active GET requests.');
    res.status(200).json({ message: 'Sync successful' });
});

// 3. fire it up
app.listen(PORT, () => {
    console.log(`Relay server working on http://localhost:${PORT}`);
});