import express from "express";
import swaggerDocument from "./public/openapi.json";
import bodyParser = require("body-parser");
import swagger = require("swagger-ui-express");
import veramoDidRoutes = require("./routes/VeramoDidRoutes");
import credentialRoutes = require("./routes/CredentialRoutes");

const app = express();

app.listen(3000, function () {
  console.log("Listening on 3000");
});
app.use(bodyParser.json());

// API Routes 📄
app.use("/", credentialRoutes);

// Util Routes 🛠
app.use("/veramo", veramoDidRoutes);

// WWW Routes 🌍
app.use("/demo", express.static("src/public", { index: "index.html" }));
app.use("/docs", swagger.serve, swagger.setup(swaggerDocument));
