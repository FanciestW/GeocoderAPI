/**
 * Logger.ts
 * Used for logging errors and warnings to local file system and to a remote
 * service called LogDNA. Includes logger objects for each module of the application.
 */

'use strict';

import { createLogger, format, transports } from 'winston';
const { combine, timestamp, prettyPrint } = format;
import logdnaWinston = require('logdna-winston');
import os = require('os');

const logDnaKey = process.env.LOGDNA_API_KEY;
const net = os.networkInterfaces();
let ipAddr = null;
let macAddr = null;
Object.keys(net).forEach((ifname) => {
    let alias = 0;
    net[ifname].forEach((iface) => {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            return; // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        }

        if (alias >= 1) {
            // this single interface has multiple ipv4 addresses
            ipAddr = iface.address;
            macAddr = iface.mac;
        } else {
            // this interface has only one ipv4 adress
            ipAddr = iface.address;
            macAddr = iface.mac;
        }
        ++alias;
    });
});

/**
 * LogDNA configs for connecting to LogDNA servers.
 */
const logDnaOptions = {
    key: logDnaKey,
    hostname: os.hostname(),
    ip: ipAddr,
    mac: macAddr,
    app: 'GeocoderAPI',
    env: 'prod',
    level: 'info', // Default to debug, maximum level of log, doc: https://github.com/winstonjs/winston#logging-levels
    index_meta: true, // Defaults to false, when true ensures meta object will be searchable
    handleExceptionss: true, // Only add this line in order to track exceptions
};

/**
 * Logger object that is used in the main API logic module (index.ts)
 */
export const ApiLogger = logDnaKey ? createLogger({
    format: combine(
        timestamp(),
        prettyPrint(),
    ),
    transports: [
        new transports.File({ filename: __dirname + '/logs/Api.log' }),
        new logdnaWinston(logDnaOptions),
    ],
}) : createLogger({
    format: combine(
        timestamp(),
        prettyPrint(),
    ),
    transports: [
        new transports.File({ filename: __dirname + '/logs/Api.log' }),
    ],
});
