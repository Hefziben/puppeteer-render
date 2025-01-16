const express = require("express");
// const { scrapeLogic } = require("./scrapeLogic");
const app = express();
const messageRouter = require("./routes/messages");
const connectDB = require("./database/index");
// Initialize the Convex client with your deployment URL

// const { ConvexHttpClient } = require("convex/browser");
// const convex = new ConvexHttpClient('https://capable-toad-329.convex.cloud');
// const {api} = require("./convex/_generated/api.js")

connectDB();

// async function getMessages() {
//   convex.query(api.functions.getItems).then(console.log);

// }

//getMessages()
console.log('Node.js version:', process.version);
const PORT = process.env.PORT || 4000;
app.use("/api/messages", messageRouter);
// app.get("/scrape", (req, res) => {
//   scrapeLogic(res);
// });

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
