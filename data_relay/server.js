const express = require('express');
const cors = require('cors'); // let the browser talk to the server
const app = express();
const PORT = 3000;

app.use(cors()); // security handshake for the frontend
app.use(express.json());

// somewhere to store the weather data in memory
let latestWeather = {};

// check if it's alive
app.get('/', (req, res) => {
    res.send('Data Relay is up and running!');
});

// the endpoint for the website to grab the data
app.get('/weather', (req, res) => {
    res.json(latestWeather);
});

// the endpoint where tier 1 sends the goods
app.post('/update-weather', (req, res) => {
    latestWeather = req.body; // save the python data
    console.log('Just got new data from Tier 1:', latestWeather);

    // send a thumbs up back to python
    res.status(200).json({ message: 'Data received by the relay!' });
});

app.listen(PORT, () => {
    console.log(`Relay server working on http://localhost:${PORT}`);
});