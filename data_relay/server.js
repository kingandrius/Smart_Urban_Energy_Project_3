const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000; // Updated for Azure (Azure sets its own port)

// 1. House Rules
app.use(cors());
app.use(express.json());

// Point to the 'dashboard' folder for the frontend
app.use(express.static(path.join(__dirname, 'dashboard')));

// 2. The Endpoints

// Status Check
app.get('/status', (req, res) => {
    res.send('Data Relay is up and running in the cloud!');
});

// Historical Endpoint: Reads JSON files from logic_engine folder
app.get('/weather', (req, res) => {
    const month = (req.query.month || 'march').toLowerCase();
    const fileName = `${month}_analysis.json`;

    // Path updated to point into /logic_engine/
    const dataPath = path.join(__dirname, 'logic_engine', fileName);

    console.log(`Relay: Accessing ${dataPath}`);

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Missing file: ${fileName}`);
            return res.status(404).json({
                error: `Data for ${month} not found in logic_engine.`
            });
        }
        res.json(JSON.parse(data));
    });
});

// Live Weather Endpoint: Triggers Python logic from logic_engine folder
app.get('/live-weather', (req, res) => {
    const city = req.query.city || 'Maastricht';

    // Path updated to find the script inside /logic_engine/
    const scriptPath = path.join(__dirname, 'logic_engine', 'live_weather.py');

    // Note: Azure Linux uses 'python3', Windows uses 'python'
    const pythonCmd = process.platform === "win32" ? "python" : "python3";

    const pythonProcess = spawn(pythonCmd, [scriptPath, city]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (errorString) {
            console.error(`Python Logic Error: ${errorString}`);
        }

        try {
            if (dataString) {
                res.json(JSON.parse(dataString));
            } else {
                res.status(500).json({ error: "No data from Python" });
            }
        } catch (e) {
            res.status(500).json({ error: "Parsing error" });
        }
    });
});

// 3. Fire it up
app.listen(PORT, () => {
    console.log(`Relay server working on port ${PORT}`);
});