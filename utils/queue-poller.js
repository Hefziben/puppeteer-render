
const Poller = require("./poller");
const axios = require("axios");
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
    const response = await axios.get(queueUrl);
    const queueItems = response.data
    console.log("queueItems", queueItems.length);
    
      if (queueItems.length === 0) {
        console.log("no items for ", sessionQueue.name, client?.connected);
        sessionQueue.poller.pollRefresh();
      } else {
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
               response = await getMessageFromAgent(requestBody);
            }
                    
          // Send response         
          sendMessage(client, current.from, response.data)
            .then(async (response) => {
              if (response === "success") {
                await axios.delete(queueUrl + "/" + current._id);
                client.stopTyping(current.from);
                console.log("Result: success");
              } else {
                client.stopTyping(current.from);
              }
            })
            .catch((error) => {
              client.stopTyping(current.from);
              console.error("Error when sending: ", error);
            });

          sessionQueue.poller.pollRefresh();
        } else {
          console.log("not connected yet");
          sessionQueue.poller.pollRefresh();
        }
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
   return response = await axios.post(aiServerUrl, requestBody);
} catch (error) {
  console.error("Error while sending request to AI server:", error.message);
  throw new Error("Failed to process the request."); // Re-throw or handle the error appropriately
}
}

module.exports = {
  runSessionQueues,
  ValidationRegex,
};
