import express from "express";
import swaggerDocument from "./src/util/openapi.json";
import bodyParser = require("body-parser");
import swagger = require("swagger-ui-express");
import veramoDidRoutes = require("./src/routes/VeramoDidRoutes");
import credentialRoutes = require("./src/routes/CredentialRoutes");

/** TODO:
 *  - Adhere to response schema of OpenAPI spec
 *  - Error communication
 *  - Add types
 *  - Document util routes in OpenAPI spec
 */
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
