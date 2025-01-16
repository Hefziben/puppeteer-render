const express = require("express");
const SessionModel = require("../models/session");
const QueueModel = require("../models/queue");
const { runSessionQueues, ValidationRegex } = require("../utils/queue-poller");
const {create} = require('@hefziben84/wppconnect')
const puppeteer = require("puppeteer");

const clientsMap = new Map();

const router = express.Router();

const numberRegex = /61234490/;

const createSessions = async () => {
    const sessions = await SessionModel.find();
    if (sessions.length === 0) return;

    sessions.forEach(async (session) => {
        create({
            session: session.name,
            autoClose: false,
            puppeteerOptions: {
                headless: true,
                executablePath: process.env.NODE_ENV === "production"
                    ? process.env.PUPPETEER_EXECUTABLE_PATH
                    : puppeteer.executablePath()
            },
            catchQR: async (base64Qr, asciiQR) => {
                const updatedSession = await SessionModel.findByIdAndUpdate(
                    session._id,
                    { base64Qr },
                    { new: true, runValidators: true }
                );

                console.log('asciiQR', asciiQR); // Optional to log the QR in the terminal
                const matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                if (matches === null) {
                    return new Error('Invalid input string');
                }
                const response = { type: matches[1], data: Buffer.from(matches[2], 'base64') };

                const imageBuffer = response;
                require('fs').writeFile(
                    'out.png',
                    imageBuffer.data,
                    'binary',
                    function (err) {
                        if (err) {
                            console.log(err);
                        }
                    }
                );
            },
            logQR: false,
        })
            .then(async (client) => {
                runSessionQueues(clientsMap, client);                
                client.onMessage(async (message) => {
                    // On message, save to the queue table
                    if (ValidationRegex.test(message.from) && numberRegex.test(message.from)) {
                        const queue = {
                            client: client.session,
                            from: message.from,
                            message: message.body
                        };

                        const newQueue = new QueueModel(queue);
                        const savedQueue = await newQueue.save();
                        console.log('savedQueue', savedQueue);
                    }
                });
            })
            .catch((error) => console.log(error));
    });
};

testSession = async () => { 
        create({
            session: 'test-1',
            autoClose: false,

            catchQR: async (base64Qr, asciiQR) => {
                // const updatedSession = await SessionModel.findByIdAndUpdate(
                //     session._id,
                //     { base64Qr },
                //     { new: true, runValidators: true }
                // );
console.log('=================asciiQR===================');
console.log(base64Qr);
console.log('====================================');
                 // Optional to log the QR in the terminal
                // const matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
                // if (matches === null) {
                //     return new Error('Invalid input string');
                // }
                // const response = { type: matches[1], data: Buffer.from(matches[2], 'base64') };

                // const imageBuffer = response;
                // require('fs').writeFile(
                //     'out.png',
                //     imageBuffer.data,
                //     'binary',
                //     function (err) {
                //         if (err) {
                //             console.log(err);
                //         }
                //     }
                // );
            },
            logQR: false,
        })
            .then(async (client) => {
                runSessionQueues(clientsMap, client);                
                client.onMessage(async (message) => {
                    console.log('message', message);
                    return
                    
                    // On message, save to the queue table
                    if (ValidationRegex.test(message.from) && numberRegex.test(message.from)) {
                        const queue = {
                            client: client.session,
                            from: message.from,
                            message: message.body
                        };

                        const newQueue = new QueueModel(queue);
                        const savedQueue = await newQueue.save();
                        console.log('savedQueue', savedQueue);
                    }
                });
            })
            .catch((error) => console.log(error));
    
}

//createSessions();
testSession()
module.exports = router;
