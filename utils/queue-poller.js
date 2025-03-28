
const Poller = require("./poller");
const axios = require("axios");
const https = require("https");
require("dotenv").config();

let flowObj = {};
const delay = 3000;
const ValidationRegex = /@c\.us$/;

const runSessionQueues = (Clients, client) => {
  if (Clients.has(client.session)) {
    Clients.set(client.session, client);
    // Updated session, so replace poller object
    flowObj[client.session].poller.stop(client.session);
    flowObj[client.session] = { name: client.session, poller: new Poller(delay, client.session) };
    runSessionPoller(flowObj[client.session], client);
  } else {
    Clients.set(client.session, client);
    flowObj[client.session] = { name: client.session, poller: new Poller(delay, client.session) };
    runSessionPoller(flowObj[client.session], client);
  }
};

const runSessionPoller = (sessionQueue, client) => {
  sessionPollerFunction(sessionQueue, client);
  console.log("-- run flow poller--", sessionQueue.name);
};

const sessionPollerFunction = (sessionQueue, client) => {
  sessionQueue.poller.onPoll(async () => {
    const queueUrl  = `${process.env.SERVER_URL}/api/queue`;
    const queueRecordsUrl  = `${process.env.SERVER_URL}/api/queueRecords`;       
    try {
      const queueItems = await fetchQueueData(queueUrl);
      console.log("queueItems", queueItems.length);
      console.log('is connected?', client?.connected)
      
        if (queueItems.length === 0) {
          console.log("no items for ", sessionQueue.name, client?.connected);
          sessionQueue.poller.pollRefresh();
        } else {
          console.log('is connected?', client?.connected);        
          if (client?.connected) {
            const current = queueItems[0]; 
            if (!ValidationRegex.test(current.from)) {
              await axios.delete(queueUrl + "/" + current._id);
              sessionQueue.poller.pollRefresh();
              return;
            }
  
            client.startTyping(current.from);
  
            const customer = await getCustomerId(current.from);
            // Delegate this to the bot agent          
              const requestBody = {
                message: current.message,
                customer: customer,
                session: current.client.session
              }; 
              let response = ''
              if ( current.type === "whatsapp") {  
                console.log('is whatsapp', current.type);
                            
                 response = await getMessageFromAgent(requestBody);
                 if (response === 'error') {
                  client.stopTyping(current.from);
                  sessionQueue.poller.pollRefresh();
                  return;
                 }
              }
                      
            // Send response  
            try {
              const isRecord = await fetchQueueData(queueRecordsUrl + "/" + current._id);
              console.log("Fetched isRecord data:", isRecord);
              if (!isRecord) {
                sendMessage(client, current.from, response)
                .then(async (res) => {
                  if (res === "success") {
                    await axios.delete(queueUrl + "/" + current._id);
                    await axios.post(queueRecordsUrl, {item: current._id});
                    client.stopTyping(current.from);
                    console.log("Result: success");
                    sessionQueue.poller.pollRefresh();
                  } else {
                    client.stopTyping(current.from);
                    sessionQueue.poller.pollRefresh();
                  }
                })
                .catch((error) => {
                  client.stopTyping(current.from);
                  console.error("Error when sending: ", error);
                  sessionQueue.poller.pollRefresh();
                });
              }  
            } catch (error) {
              console.error("Error fetching queue data:", error.message);
            }
            
          } else {
            console.log("not connected yet");
            sessionQueue.poller.pollRefresh();
          }
        }
    } catch (error) {
      console.error("Error fetching queue data:", error.message);
    }


  });
  sessionQueue.poller.poll();
};

const getCustomerId = (item) => {
  // Clean mobile number
  const id = item.split("@")[0];
  return id;
};

const sendMessage = (client, from, message) => {
  if (client.connected) {
    return client
      .sendText(from, message)
      .then(() => {
        console.log("message sent: success", message);
        return "success";
      })
      .catch((error) => {
        console.error("Error when sending: ", error);
        return "error";
      });
  } else {
    return "not connected yet";
  }
};

async function getMessageFromAgent(requestBody) {
  let response = '';
  const aiServerUrl  = `${process.env.AI_SERVER_URL}/api/messages/answer`;
  
try {
    response = await axios.post(aiServerUrl, requestBody);
   console.log(response.data);
   return response.data
   
} catch (error) {
  console.error("Error while sending request to AI server:", error.message);
  return 'error'
}
}


const httpsAgent = new https.Agent({
  keepAlive: true, // Persistent connection
  rejectUnauthorized: false, // Optional: Disable SSL certificate validation (use cautiously)
});

async function fetchQueueData(queueUrl, retries = 3) {
  try {
    // Create an Axios instance with custom configuration
    const axiosInstance = axios.create({
      timeout: 10000, // 10 seconds timeout
      httpsAgent, // Use the HTTPS agent for persistent connection
    });

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`Attempt ${attempt} to fetch data from: ${queueUrl}`);
        const response = await axiosInstance.get(queueUrl);
        console.log("Data successfully fetched:", response.data);
        return response.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error(`Axios error on attempt ${attempt}:`, error.message);
        } else {
          console.error(`Unexpected error on attempt ${attempt}:`, error);
        }
        // Retry logic: Throw error only after the last attempt
        if (attempt === retries) throw error;
      }
    }
  } catch (error) {
    // Handle final error
    if (axios.isAxiosError(error)) {
      console.error("Final Axios error:", error.message);
    } else {
      console.error("Unexpected final error:", error);
    }

    throw new Error("Failed to fetch queue data after multiple attempts.");
  }
}

module.exports = fetchQueueData;



module.exports = {
  runSessionQueues,
  ValidationRegex,
};
