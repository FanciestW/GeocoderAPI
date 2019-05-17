'use strict';

const PORT = 8080;
import googleMaps = require('@google/maps');
import bodyParser = require('body-parser');
import express = require('express');
import redis = require('redis');
import swaggerUi = require('swagger-ui-express');
import { ApiLogger } from './Loggers';
import swaggerDocument = require('./swagger.json');

const app = express();
app.use(bodyParser.json());         // to support JSON-encoded bodies.
app.use(bodyParser.urlencoded());   // to support URl-encoded data.
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

const mapClient = googleMaps.createClient({
    key: process.env.GOOGLE_MAPS_API_KEY,
});

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
});

app.use('/', swaggerUi.serve);
app.get('/', swaggerUi.setup(swaggerDocument));

app.get('/keys_test', (req, res) => {
    ApiLogger.warn('Get /keys_test', {
        timestamp: Date().toString(),
        requestIp: req.ip,
        requestHostname: req.hostname,
        reqeustBody: req.body,
        requestQuery: req.query,
    });
    const pattern = req.body.pattern || '*';
    redisClient.keys(pattern, (err, keys) => {
        if (err) {
            res.status(500).send(err);
        }
        res.status(200).send(keys);
    });
});

app.get('/country_test', (req, res) => {
    ApiLogger.warn('Get /country_test', {
        timestamp: Date().toString(),
        requestIp: req.ip,
        requestHostname: req.hostname,
        reqeustBody: req.body,
        requestQuery: req.query,
        location: req.query.location,
    });
    const location = req.query.location;
    if (!location) {
        res.status(400).send('Bad Request');
        return;
    }
    redisClient.get(location, (redisErr, redisRes) => {
        if (redisErr || redisRes === null) {
            // Geocode an address.
            mapClient.geocode({
                address: location,
            }, (mapErr, mapRes) => {
                if (!mapErr) {
                    if (mapRes.json.results === undefined || mapRes.json.results.length === 0) {
                        redisClient.set(location, 'No Results');
                        res.status(200).send('No Results');
                    }
                    const addrComponents = mapRes.json.results[0].address_components;
                    let country = null;
                    for (const e of addrComponents) {
                        if (e.types.includes('country')) {
                            country = e;
                            break;
                        }
                    }
                    const longName = country.long_name ? country : 'No Results';
                    redisClient.set(location, longName);
                    res.status(200).send(longName);
                } else {
                    res.status(500).send(mapErr);
                }
            });
        } else {
            res.status(200).send(`${location} exists already with value ${redisRes}`);
        }
    });
});

app.get('/remove_key_test', (req, res) => {
    ApiLogger.error('Get /remove_key_test', {
        timestamp: Date().toString(),
        requestIp: req.ip,
        requestHostname: req.hostname,
        reqeustBody: req.body,
        requestQuery: req.query,
    });
    const key = req.query.key;
    redisClient.del(key, (err, response) => {
        if (err) {
            res.status(500).send('Error');
        } else if (response !== 1) {
            res.status(500).send(`${key} was not deleted.`);
        } else {
            res.status(200).send('OK');
        }
    });

});

app.get('/country', (req, res) => {
    const location = req.query.location;
    if (!location) {
        ApiLogger.error('Get /country error, no location provided', {
            timestamp: Date().toString(),
            requestIp: req.ip,
            requestHostname: req.hostname,
            reqeustBody: req.body,
            requestQuery: req.query,
        });
        res.status(400).send('Bad Request');
        return;
    }
    ApiLogger.info('Get /country', {
        timestamp: Date().toString(),
        requestIp: req.ip,
        requestHostname: req.hostname,
        reqeustBody: req.body,
        requestQuery: req.query,
        location: req.query.location,
    });
    redisClient.get(location, (redisErr, redisRes) => {
        if (redisErr || redisRes === null) {
            mapClient.geocode({
                address: location,
            }, (mapErr, mapRes) => {
                if (!mapErr) {
                    if (mapRes.json.results === undefined || mapRes.json.results.length === 0) {
                        redisClient.set(location, 'No Results');
                        res.status(200).send('No Results');
                    }
                    const addrComponents = mapRes.json.results[0].address_components;
                    const country = addrComponents[addrComponents.length - 1];
                    const longName = country.long_name;
                    redisClient.set(location, longName);
                    res.status(200).send(longName);
                } else {
                    ApiLogger.error('Get /country Google Maps geocode error', {
                        timestamp: Date().toString(),
                        requestIp: req.ip,
                        requestHostname: req.hostname,
                        reqeustBody: req.body,
                        requestQuery: req.query,
                        location: req.query.location,
                    });
                    res.status(500).send(mapErr);
                }
            });
        } else {
            res.status(200).send(redisRes);
        }
    });
});

app.get('/geocode', (req, res) => {
    const location = req.query.location;
    if (location) {
        ApiLogger.info('Get /geocode', {
            timestamp: Date().toString(),
            requestIp: req.ip,
            requestHostname: req.hostname,
            reqeustBody: req.body,
            requestQuery: req.query,
            location: req.query.location,
        });
        mapClient.geocode({
            address: location,
        }, (err, response) => {
            if (!err) {
                res.status(200).send(response.json.results);
            } else {
                ApiLogger.error('Get /geocode Google Maps geocode error', {
                    timestamp: Date().toString(),
                    requestIp: req.ip,
                    requestHostname: req.hostname,
                    reqeustBody: req.body,
                    requestQuery: req.query,
                    location: req.query.location,
                });
                res.status(500).send(err);
            }
        });
    } else {
        ApiLogger.error('Get /geocode location not provided', {
            timestamp: Date().toString(),
            requestIp: req.ip,
            requestHostname: req.hostname,
            reqeustBody: req.body,
            requestQuery: req.query,
        });
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
