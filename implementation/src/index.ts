import express from "express";
import swaggerDocument from "./public/openapi.json";
import bodyParser = require("body-parser");
import swagger = require("swagger-ui-express");
import veramoUtilRoutes = require("./routes/VeramoUtilRoutes");
import holderRoutes = require("./routes/HolderRoutes");
import verifierRoutes = require("./routes/VerifierRoutes");
import issuerRoutes = require("./routes/IssuerRoutes");

const app = express();

app.listen(3000, function () {
  console.log("Listening on 3000");
});
app.use(bodyParser.json());

// API Routes 📄
app.use("/", holderRoutes);
app.use("/", verifierRoutes);
app.use("/", issuerRoutes);

// Util Routes 🛠
app.use("/veramo", veramoUtilRoutes);

// WWW Routes 🌍
app.use("/demo", express.static("src/public", { index: "index.html" }));
app.use("/docs", swagger.serve, swagger.setup(swaggerDocument));
