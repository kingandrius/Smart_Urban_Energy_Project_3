const express = require('express');
const app = express();
const PORT = 3000;

// allow the server to read JSON data
app.use(express.json());

// this is the landing page of the relay
app.get('/', (req, res) => {
    res.send('Data Relay is up and running!');
});

// the endpoint where tier 1 will send data
app.post('/update-weather', (req, res) => {
    const weatherData = req.body;
    console.log('Just got new data from Tier 1:', weatherData);

    // send a thumbs up back to python
    res.status(200).json({ message: 'Data received by the relay!' });
});

app.listen(PORT, () => {
    console.log(`Relay server working on http://localhost:${PORT}`);
});