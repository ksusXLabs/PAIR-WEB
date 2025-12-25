const express = require("express");
const app = express();
__path = process.cwd();
const bodyParser = require("body-parser");
const fs = require("fs");
const PORT = process.env.PORT || 8000;

let code = require("./pair");

require("events").EventEmitter.defaultMaxListeners = 500;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Existing /code route
app.use("/code", code);

// Load plugins dynamically
const pluginFiles = fs.readdirSync(__path + "/plugins").filter(f => f.endsWith(".js"));
pluginFiles.forEach(file => {
  const plugin = require(__path + "/plugins/" + file);
  if(plugin.route && plugin.method && plugin.handler) {
    app[plugin.method](plugin.route, plugin.handler);
    console.log(`✅ Plugin loaded: ${file} -> ${plugin.route}`);
  }
});

// Serve frontend
app.use("/", async (req, res) => {
  res.sendFile(__path + "/pair.html");
});

app.listen(PORT, () => {
  console.log("⏩ IZUMI LITE running on port " + PORT);
});

module.exports = app;
