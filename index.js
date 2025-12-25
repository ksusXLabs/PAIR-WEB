const express = require("express");
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;

let code = require("./pair");

require("events").EventEmitter.defaultMaxListeners = 500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/code", code);

app.use("/", async (req, res) => {
  res.sendFile(__path + "/pair.html");
});

app.listen(PORT, () => {
  console.log("⏩ IZUMI LITE running on port " + PORT);
});

module.exports = app;
