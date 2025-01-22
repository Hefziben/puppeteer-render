
const Poller = require("./poller");
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
    console.log("new session", client.session);
    Clients.set(client.session, client);
    flowObj[client.session] = { name: client.session, poller: new Poller(delay, client.session) };
    runSessionPoller(flowObj[client.session], client);
  }

  console.log("====================================");
  console.log("runSessionQueues", Clients.size);
  console.log("====================================");
};

const runSessionPoller = (sessionQueue, client) => {
  sessionPollerFunction(sessionQueue, client);
  console.log("-- run flow poller--", sessionQueue.name);
};

const sessionPollerFunction = (sessionQueue, client) => {
  sessionQueue.poller.onPoll(async () => {
    const queueUrl  = `${process.env.SERVER_URL}/api/queue`;
    const queueItems = await axios.get(queueUrl);
      if (queueItems.length === 0) {
        console.log("no items for ", sessionQueue.name, client?.connected);
        sessionQueue.poller.pollRefresh();
      } else {
        console.log("items", queueItems.length);
        if (client?.connected) {
          const current = queueItems[0];
          if (!ValidationRegex.test(current.from)) {
            await axios.delete(queueUrl + "/" + current._id);
            sessionQueue.poller.pollRefresh();
            return;
          }

          client.startTyping(current.from);

          const customer = await getCustomerId(current.from);
          console.log("customer", customer);

          // Delegate this to the bot agent
          // const response = current.type === "scheduler"
          //   ? current.message
          //   : await progressConversation(current.message, customer, current.client.session);
         const response = ''
          // Send response
          sendMessage(client, current.from, response)
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
        console.log("Result: success");
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

module.exports = {
  runSessionQueues,
  ValidationRegex,
};
