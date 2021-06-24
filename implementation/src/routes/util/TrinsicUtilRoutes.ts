import express from "express";
import { TrinsicProvider } from "../../provider/trinsic/TrinsicProvider";

const router = express.Router();
const trinsic = TrinsicProvider.getInstance();

router
  .get("/connections", async (req, res) => {
    const connections = await trinsic.client.listConnections(null);
    return res.status(200).send(connections);
  })
  .get("/credentials", async (req, res) => {
    const credentials = await trinsic.client.listCredentials();
    return res.status(200).send(credentials);
  })
  .get("/credentials/:id", async (req, res) => {
    const credentials = await trinsic.client.getCredential(req.params.id);
    return res.status(200).send(credentials);
  })
  .get("/policies", async (req, res) => {
    const policies = await trinsic.client.listVerificationPolicies();
    return res.status(200).send(policies);
  })
  .get("/policies/:id", async (req, res) => {
    const policies = await trinsic.client.getVerificationPolicy(req.params.id);
    return res.status(200).send(policies);
  })
  .get("/definitions/", async (req, res) => {
    const definitions = await trinsic.client.listCredentialDefinitions();
    return res.status(200).send(definitions);
  })
  .get("/definitions/:id", async (req, res) => {
    const definition = await trinsic.client.getCredentialDefinition(req.params.id);
    return res.status(200).send(definition);
  })
  .get("/verifications", async (req, res) => {
    const verifications = await trinsic.client.listVerifications();
    return res.status(200).send(verifications);
  })
  .get("/verifications/:id", async (req, res) => {
    const verification = await trinsic.client.getVerification(req.params.id);
    return res.status(200).send(verification);
  })
  .get("/usage", async (req, res) => {
    const usage = await trinsic.provider.getCurrentUsage();
    return res.status(200).send(usage);
  });

export = router;
