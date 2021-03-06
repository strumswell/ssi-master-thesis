import express from "express";
import swaggerDocument from "./public/openapi.json";
import bodyParser from "body-parser";
import swagger from "swagger-ui-express";
import holderRoutes from "./routes/HolderRoutes";
import issuerRoutes from "./routes/IssuerRoutes";
import verifierRoutes from "./routes/VerifierRoutes";
import veramoUtilRoutes from "./routes/util/VeramoUtilRoutes";
import veramoAgentRoutes from "./routes/util/VeramoAgentAPI";
import mattrVerifierRoutes from "./routes/util/MattrVerifierRoutes";
import mattrUtilRoutes from "./routes/util/MattrUtilRoutes";
import trinsicVerifierRoutes from "./routes/util/TrinsicVerifierRoutes";
import trinsicUtilRoutes from "./routes/util/TrinsicUtilRoutes";
import azureUtilRoutes from "./routes/util/AzureUtilRoutes";

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// API Routes 📄
app.use("/", holderRoutes);
app.use("/", verifierRoutes);
app.use("/", issuerRoutes);

// Util Routes 🛠
app.use("/veramo", veramoUtilRoutes);
app.use("/", veramoAgentRoutes);

app.use("/mattr", mattrUtilRoutes);
app.use("/mattr/verifier", mattrVerifierRoutes);

app.use("/trinsic", trinsicUtilRoutes);
app.use("/", trinsicVerifierRoutes);

app.use("/", azureUtilRoutes);

// WWW Routes 🌍
app.use("/demo", express.static("src/public", { index: "index.html" }));
app.use("/docs", swagger.serveFiles(swaggerDocument), swagger.setup(swaggerDocument));

app.listen(3000, () => {
  console.log("🏠 Running on http://localhost:3000");
  console.log(`🛰  Proxy running on ${process.env.LOCAL_DEV_URL}/docs`);
});
