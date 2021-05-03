const express = require("express");
const app = express();
const swagger = require("swagger-ui-express"),
  swaggerDocument = require("./util/openapi.json");

app.listen(3000, function () {
  console.log("Listening on 3000");
});

// WWW Routes 🌍
app.use("/demo", express.static("www", { index: "index.html" }));
app.use("/docs", swagger.serve, swagger.setup(swaggerDocument));

// API Routes 📄
app.post("/credentials/issue", (req, res) => {
  res.send({ success: true });
});

app.post("/credentials/status", (req, res) => {
  res.send({ success: true });
});

app.post("/credentials/verify", (req, res) => {
  res.send({ success: true });
});

app.post("/presentations/issue", (req, res) => {
  res.send({ success: true });
});

app.post("/presentations/verify", (req, res) => {
  res.send({ success: true });
});
