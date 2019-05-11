"use strict";

const PORT = 8080;
import bodyParser = require("body-parser");
import express = require("express");
import "reflect-metadata";

const app = express();
app.use(bodyParser.json());         // to support JSON-encoded bodies
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
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
