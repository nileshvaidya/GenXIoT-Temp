import { getDevices, getDevicesById } from './db/DevicesDB';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import config from 'config';
import mongoose from 'mongoose';
import { DB, PORT } from './config';
import logger from './utils/logger';
import { version } from '../package.json';
//import createHttpError from "http-errors";
import { socket } from './socket';
import mqttclient from './mqttclient';
import morgan from 'morgan';
import DeviceData from './models/DeviceData';
import logging from './utils/logging';
import bodyParser from 'body-parser';
import configuration from '../config/config';
import Logging from './library/Logging';

const NAMESPACE = 'app';
//import socket from "./socket";

const port = config.get<number>('port');
const host = config.get<string>('host');
const corsOrigin = config.get<string>('corsOrigin');

const app = express();

/** Logging the request */
app.use((req, res, next) => {
    logging.info(NAMESPACE, `METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}], STATUS - [${res.statusCode}]`);

    res.on('finish', () => {
        logging.info(NAMESPACE, `METHOD - [${req.method}], URL - [${req.url}], IP - [${req.socket.remoteAddress}], STATUS - [${res.statusCode}]`);
    });
});

/** Parse the request */
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**Rules of our API */
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (req.method == 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }

    next();
});

/** Error handling */
app.use((req, res, next) => {
    const error = new Error('Not found');

    res.status(404).json({
        message: error.message
    });
});

/** Connect to Mongo */
mongoose
    .connect(DB!)
    .then(() => {
        Logging.info('Connected to db');
        app.listen(PORT, () => {
            Logging.info(`Listening On Port ${PORT}`);
        });
    })
    .catch((error) => {
        Logging.error('Unable to connect database');
        Logging.error(error);
    });

const httpServer = createServer(app);
app.use(express.json());
app.use(morgan('tiny'));
const io = new Server(httpServer, {
    cors: {
        origin: corsOrigin,
        credentials: true
    }
});

app.get('/', (_, res) => res.send(`Server is up and running version ${version}`));

httpServer.listen(port, host, () => {
    logging.info(NAMESPACE, `Server is running ${configuration.server.hostname}:${configuration.server.port}`);
    logger.info(`🚀 Server version  ${version} is listening 🚀`);
    logger.info(`http://${host}:${port}`);

    socket({ io });
    mqttclient();
    //var devices = getDevicesById('SB005HG','62d8ef40194a0cac7c9b1499');
});
