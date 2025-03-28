const express = require("express");
const SessionModel = require("../models/session");
const { runSessionQueues, ValidationRegex } = require("../utils/queue-poller");
const {create} = require('@hefziben84/wppconnect')
const axios = require("axios");
require("dotenv").config();

const clientsMap = new Map();

const router = express.Router();

const numberRegex = /61234490|65121737/;
const queueUrl  = `${process.env.SERVER_URL}/api/queue`;
const sessionUrl  = `${process.env.SERVER_URL}/api/session`;

const startSessions = async () => { 
    const response = await axios.get(sessionUrl);
    const sessions = response.data;          
    if (sessions.length === 0) return;
    sessions.forEach(async (session) => {
        createSession(session);
    });
};


const createSession = async (dbSession) => {
    create({
        session: dbSession.name,
        autoClose: false,
        puppeteerOptions: {
          headless: true,
        },
        statusFind: (statusSession, waSession) => {
          console.log("Status Session: ", statusSession); //return isLogged || notLogged || browserClose || qrReadSuccess || qrReadFail || autocloseCalled || desconnectedMobile || deleteToken
          //Create session wss return "serverClose" case server for close
          console.log("Session name: ", waSession);
          if (
            statusSession === "browserClose" ||
            statusSession === "serverClose"  ||
            statusSession === "autocloseCalled"
          ) {
            console.log("session closed");
            createSession(waSession);
          }
        },
        catchQR: async (base64Qr) => {
            if (dbSession) {
                console.log('dbSession', dbSession._id);
                
                try {
                    const response = await axios.put(`${sessionUrl}/${dbSession._id}`, {
                      base64Qr,
                    });
                    const sessionData = response.data;
                    if (sessionData) {
                      console.log("new qr saved");
                    }
                  } catch (error) {
                    console.log('error',error.message);
                  }
            }

        },
        logQR: true,
      })
        .then(async (client) => {
          runSessionQueues(clientsMap, client);
          client.onMessage(async (message) => {
            // On message, save to the queue table
            if (
              ValidationRegex.test(message.from) &&
              numberRegex.test(message.from)
            ) {
              const queue = {
                client: client.session,
                from: message.from,
                message: message.body,
              };
              try {
                const queueResponse = await axios.post(queueUrl, queue);
                const savedQueue = queueResponse.data;
                console.log("savedQueue", savedQueue);
              } catch (error) {
                console.log(error);
              }
            }
          });
        })
        .catch((error) => console.log(error));
    
}

startSessions();
module.exports = router;
