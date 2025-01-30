const express = require("express");
const morgan = require("morgan"); // Import morgan
const app = express();

require("dotenv").config();
const messageRoutes = require("./routes/messages");

const PORT = process.env.PORT || 4000;

app.use(morgan("tiny")); // Logs requests in a short format

app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.get("/ping", (req, res) => {
  res.status(200).json({message:'I was pinned by Server'});
  
});

app.use("/api/messages", messageRoutes)

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
