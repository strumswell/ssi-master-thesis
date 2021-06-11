import express from "express";
import swagger = require("swagger-ui-express");
import { veramoAgent } from "../../provider/veramo/VeramoSetup";
import {
  AgentRouter,
  ApiSchemaRouter,
  WebDidDocRouter,
  RequestWithAgentRouter,
  createDefaultDid,
  MessagingRouter,
  apiKeyAuth,
} from "@veramo/remote-server";

// Paths
const exposedMethods = veramoAgent.availableMethods();
const basePath = "/agent";
const schemaPath = "/open-api.json";
const messagingPath = "/messaging";

// Router
const agentRouter = AgentRouter({
  exposedMethods,
});
const schemaRouter = ApiSchemaRouter({
  basePath,
  exposedMethods,
  securityScheme: "bearer",
});
const didDocRouter = WebDidDocRouter();
const messagingRouter = MessagingRouter({ metaData: { type: "DIDComm", value: "https" } });

// Inject routes
const router = express.Router();
router.use(RequestWithAgentRouter({ agent: veramoAgent }));
router.use(basePath, agentRouter);
router.use(schemaPath, schemaRouter);
router.use(messagingPath, messagingRouter);
router.use(didDocRouter);
router.use(
  "/veramo-docs",
  swagger.serveFiles(null, { swaggerOptions: { url: `${process.env.LOCAL_DEV_URL}/open-api.json` } }),
  swagger.setup(null, { swaggerOptions: { url: `${process.env.LOCAL_DEV_URL}/open-api.json` } })
);

// Create web:did for local dev url if not already defined
createDefaultDid({
  agent: veramoAgent,
  baseUrl: process.env.LOCAL_DEV_URL,
  messagingServiceEndpoint: messagingPath,
});

// Set API key for Veramo agent api
apiKeyAuth({ apiKey: process.env.VERAMO_AGENT_API_KEY });

export = router;
