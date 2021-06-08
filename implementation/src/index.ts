import express from "express";
import swaggerDocument from "./public/openapi.json";
import bodyParser = require("body-parser");
import swagger = require("swagger-ui-express");
import veramoUtilRoutes = require("./routes/VeramoUtilRoutes");
import holderRoutes = require("./routes/HolderRoutes");
import verifierRoutes = require("./routes/VerifierRoutes");
import mattrVerifierRoutes = require("./routes/MattrVerifierOIDCRoutes");
import trinsicVerifierRoutes = require("./routes/TrinsicVerifierRoutes");
import issuerRoutes = require("./routes/IssuerRoutes");

const app = express();

app.use(bodyParser.json());

// API Routes 📄
app.use("/", holderRoutes);
app.use("/", verifierRoutes);
app.use("/", issuerRoutes);

// Util Routes 🛠
app.use("/veramo", veramoUtilRoutes);
app.use("/mattr/verifier", mattrVerifierRoutes);
app.use("/", trinsicVerifierRoutes);

// WWW Routes 🌍
app.use("/demo", express.static("src/public", { index: "index.html" }));
app.use("/docs", swagger.serve, swagger.setup(swaggerDocument));

app.listen(3000, async () => {
  console.log("Listening on 3000");
  console.log(`Proxy running @ ${process.env.LOCAL_DEV_URL}:3000/docs`);
});
