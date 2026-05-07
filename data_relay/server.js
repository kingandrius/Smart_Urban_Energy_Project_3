const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dashboard')));

app.get('/status', (req, res) => {
    res.send('Data Relay is alive and ready.');
});

const validMonths = new Set(['january', 'february', 'march']);
app.get('/weather', async (req, res) => {
    const month = (req.query.month || 'march').toLowerCase();
    if (!validMonths.has(month)) {
        return res.status(400).json({ error: 'Pick january, february, or march.' });
    }

    const dataPath = path.join(__dirname, 'logic_engine', `${month}_analysis.json`);

    try {
        const contents = await fs.readFile(dataPath, 'utf8');
        res.json(JSON.parse(contents));
    } catch (err) {
        console.error('history file error:', err.message);
        res.status(404).json({ error: `No saved data for ${month}.` });
    }
});

app.get('/live-weather', (req, res) => {
    const city = (req.query.city || 'Maastricht').trim();
    const scriptPath = path.join(__dirname, 'logic_engine', 'weather_service.py');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';

    const python = spawn(pythonCmd, [scriptPath, city]);
    let stdout = '';
    let stderr = '';
    let finished = false;

    const timeout = setTimeout(() => {
        if (finished) return;
        finished = true;
        python.kill();
        res.status(500).json({ error: 'Weather fetch timed out.' });
    }, 5000);

    python.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
    python.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

    python.on('error', (err) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);
        console.error('Failed to start Python:', err.message);
        res.status(500).json({ error: 'Python process failed to start.' });
    });

    python.on('close', (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timeout);

        if (stderr) console.error('Python stderr:', stderr.trim());
        if (!stdout) {
            return res.status(500).json({ error: 'No response from weather service.' });
        }

        try {
            res.json(JSON.parse(stdout));
        } catch (parseErr) {
            console.error('JSON parse error:', parseErr.message, stdout);
            res.status(500).json({ error: 'Invalid JSON from weather service.' });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Relay server running on port ${PORT}`);
});