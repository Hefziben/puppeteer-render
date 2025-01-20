const express = require("express");
const app = express();

require("dotenv").config();
const messageRoutes = require("./routes/messages");

const PORT = process.env.PORT || 4000;


app.get("/", (req, res) => {
  res.send("Render Puppeteer server is up and running!");
});

app.use("/api/messages", messageRoutes)

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
