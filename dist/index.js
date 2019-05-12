'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const PORT = 8080;
const googleMaps = require("@google/maps");
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
app.use(bodyParser.json()); // to support JSON-encoded bodies.
app.use(bodyParser.urlencoded()); // to support URl-encoded data.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
const mapClient = googleMaps.createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
});
app.get('/', (req, res) => {
    res.status(200).send('OK');
    console.log(process.env.GOOGLE_MAPS_API_KEY);
});
app.get('/country', (req, res) => {
    const location = req.query.location;
    if (location) {
        // Geocode an address.
        mapClient.geocode({
            address: location,
        }, (err, response) => {
            if (!err) {
                if (response.json.results === undefined || response.json.results.length === 0) {
                    res.status(200).send('No Results');
                }
                const addrComponents = response.json.results[0].address_components;
                const country = addrComponents[addrComponents.length - 1];
                const longName = country.long_name;
                res.status(200).send(longName);
            }
            else {
                res.status(500).send(err);
            }
        });
    }
    else {
        res.status(400).send('Bad Request');
    }
});
app.get('/geocode', (req, res) => {
    const location = req.query.location;
    if (location) {
        // Geocode an address.
        mapClient.geocode({
            address: location,
        }, (err, response) => {
            if (!err) {
                res.status(200).send(response.json.results);
            }
            else {
                res.status(500).send(err);
            }
        });
    }
    else {
        res.status(400).send('Bad Request');
    }
});
if (module === require.main) {
    // [START server]
    // Start the server
    const server = app.listen(process.env.PORT || PORT, () => {
        console.log(`App listening on port ${process.env.PORT || PORT}`);
    });
    // [END server]
}
module.exports = app;
//# sourceMappingURL=index.js.map