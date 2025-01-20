const express = require("express");
const SessionModel = require("../models/session");
const QueueModel = require("../models/queue");
const { runSessionQueues, ValidationRegex } = require("../utils/queue-poller");
const {create} = require('@hefziben84/wppconnect')
const puppeteer = require("puppeteer");
const axios = require("axios");
require("dotenv").config();

const clientsMap = new Map();

const router = express.Router();

const numberRegex = /61234490/;

const createSessions = async () => {   
    const sessionUrl  = `${process.env.SERVER_URL}/api/session`;
    const queueUrl  = `${process.env.SERVER_URL}/api/queue`;
    const response = await axios.get(sessionUrl);
    const sessions = response.data;   
    
    if (sessions.length === 0) return;

    sessions.forEach(async (session) => {
        create({
            session: session.name,
            autoClose: false,
            puppeteerOptions: {
                headless: true
            },
            catchQR: async (base64Qr) => {
                try {
                    const response = await axios.put(sessionUrl/+session._id, { base64Qr });
                    const session = response.data; 
                    console.log(session);                    
                } catch (error) {
                    console.log(error);
                }
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
                        try {
                            const queueResponse = await axios.post(queueUrl, queue);
                            const savedQueue = queueResponse.data; 
                            console.log('savedQueue', savedQueue);   
                        } catch (error) {
                            console.log(error);
                        }
                    }
                });
            })
            .catch((error) => console.log(error));
    });
};

createSessions();
module.exports = router;
