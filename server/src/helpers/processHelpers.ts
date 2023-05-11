import { Moment } from 'moment';
// import { logger } from 'pino';
//import { getClientCode, updateTimeStamp } from './../db/DevicesDB';
import Logger from '../utils/logging';
//import mongoose from 'mongoose';
import { getClientCodeFromDeviceId, saveDeviceData, updateTimeStamp } from '../db/DevicesDB';
import moment from 'moment';
import { ServerSocket } from '../socket';

const extractTimeStamp = (data: string) => {
    let json = JSON.parse(data);
    let ts = json.timestamp;
    const dateTime = moment(ts * 1000).format('YYYY-MM-DD[T]HH:mm:ss');

    Logger.info('extractTimestamp', 'Time Stamp', dateTime);
    return dateTime;
};

const FormClientMessage = (deviceId: string, lastUpdated: string) => {
    let jsonObj = {
        deviceId: deviceId,
        lastUpdated: lastUpdated
    };

    return JSON.stringify(jsonObj);
};

export const processIncomingData = async (topic: string, message: string) => {
    const { ObjectId } = require('mongodb');
    
    let v = topic.split('/');
    if (v[0] === 'askdevicedata') {
        var device_id = v[1];
        Logger.info('ProcessHelper', 'Device ID....................................................... : ', device_id);
        var clientCode = await getClientCodeFromDeviceId(device_id);
        /** UnComment when Data from Device needs to be saved. Commented for development */
        Logger.info('ProcessHelper', 'Reveived Message : ', JSON.parse(message));
        Logger.info('ProcessHelper', 'Client ID : ', clientCode);
        let tsData = extractTimeStamp(message);
        updateTimeStamp(device_id, tsData);
        let dataTimeStamp = {};
        let str = '{"' + device_id + '":"' + tsData + '"}';
        Logger.info('ProcessHelper', 'TimeStamp string : ', str);
        dataTimeStamp = JSON.parse(str);
        Logger.info('ProcessHelper', 'TimeStamp object : ', dataTimeStamp);
        // saveDeviceData(device_id, clientCode!, topic, JSON.parse(message));
        // let isClientOnline = CheckIfClientIsOnline(clientCode!);
        // if (isClientOnline) {
        //     let clientMessage = FormClientMessage(device_id, tsData);
        //     sendClientData(clientCode!, clientMessage);
        //     let isDeviceOnline = CheckIfDeviceIsOnline(device_id);
        //     if (isDeviceOnline) {
        //         sendDeviceData(device_id!, message);
        //     }
        // }
        ServerSocket.PrepareMessage(clientCode!, device_id, dataTimeStamp, JSON.parse(message));
        return clientCode;
    }
    return '';
};
