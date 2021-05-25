import { W3CCredential } from "@veramo/core";
import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * TODO:
 *  - Do error handling on provider level (see /credentials/status)
 *  - Create types to generalize return/ request types
 */
router
  .post("/credentials/issue", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }
    const credential: W3CCredential = await provider.issueVerifiableCredential(req.body);
    if (credential instanceof Error) {
      res.status(500).send({ error: credential.message });
    } else {
      res.status(201).send(credential);
    }
  })
  .post("/credentials/status", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }
    if (req.body.credentialStatus.type !== "EthrStatusRegistry2019" || req.body.credentialStatus.status !== "1") {
      res.status(400).send({ error: "Unsupported operation" });
      return;
    }
    const txHash = await provider.revokeVerifiableCredential(req.body);
    res.send(txHash);
  });

export = router;
