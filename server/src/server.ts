import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { config, DB } from './config';
import configuration from 'config';
import { ServerSocket } from './socket';
import { Server } from 'socket.io';
import mqttclient from './mqttclient';
import Logging from './library/Logging';
import deviceRoutes from './routes/Device';
import deviceDataRoutes from './routes/DeviceData';
import bodyParser from 'body-parser';
const connectToDB = require('./db/db');
// var cors = require('cors');
import cors from 'cors';
const port = 8080;// config.server.port;
const host = config.server.host;
const mongo_url = 'mongodb://127.0.0.1:27017/genxiot'
//const mongo_url = 'mongodb://0.0.0.0:27017/genxiot';//?authSource=admin';// config.mongo.url //+ "/"+ config.mongo.db_name;
const corsOrigin = configuration.get<string>('corsOrigin');

const router = express();

router.set('view engine', 'ejs');
router.use(bodyParser.urlencoded({ extended: false }));
const options = {
    dbName: 'genxiot',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    
    
};
let dbConnected
// Connect to MongoDB
function connectDB() {
    console.log('connecting to mongodb...')
    mongoose
      .connect(
          'mongodb://mongodb:27017/genxiot', options
        // 'mongodb://0.0.0.0:27017/genxiot', options
      )
      .then(() => {
          dbConnected = true;
          StartServer();
        console.log('MongoDB Connected')
      })
      .catch(err => console.log(err));
  }
  
  setTimeout(() => {
    console.log('Connect to MongoDB.');
    connectDB();
  }, 10000);
  


/** Only Start Server if Mongoose Connects */
const StartServer = () => {
    /** Log the request */
    router.use((req, res, next) => {
        /** Log the req */
        Logging.info(`Incomming - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}]`);

        res.on('finish', () => {
            /** Log the res */
            Logging.info(`Result - METHOD: [${req.method}] - URL: [${req.url}] - IP: [${req.socket.remoteAddress}] - STATUS: [${res.statusCode}]`);
        });

        next();
    });
    // StartServer();
    // router.use(express.urlencoded({ extended: true }));
    router.use(express.json());

    /** Rules of our API */
// Set up middleware to enable CORS
router.use((req, res, next) => {
    // Allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Allow the following HTTP methods
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    // Allow the following request headers
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // Allow credentials to be sent across domains
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      // Stop the middleware chain and return the response
      return res.sendStatus(200);
    }
  
    // Move on to the next middleware in the chain
    next();
  });
    /** Routes */
    router.use('/api/devices', cors(), deviceRoutes);
    router.use('/api/devicedata', cors(), deviceDataRoutes);

    /** Healthcheck */
    router.get('/api/ping', (req, res, next) => res.status(200).json({ message: 'pong' }));

    /** Error handling */
    router.use((req, res, next) => {
        Logging.warning(`URL : ${req.url}`);
        const error = new Error('Route Not found');

        Logging.error(error);

        res.status(404).json({
            message: error.message
        });
    });

    const httpServer = http.createServer(router);

    /** Start Socket */
    new ServerSocket(httpServer);

    httpServer.listen(port,  () => {
        Logging.info(`Server is running ${host}:${port}`);
        Logging.info(`http://${host}:${port}`);

        mqttclient();
        
    });
};
