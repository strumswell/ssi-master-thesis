import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * Credential Routes
 * ---------------------------------------------------
 * TODO: Come up with a cleaner way of writing this...
 */

router
  .post("/credentials/issue", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }
    const credential = await provider.issueVerifiableCredential(req.body);
    if (credential instanceof Error) {
      res.status(500).send({ error: credential.message });
    } else {
      res.status(201).send({ credential });
    }
  })
  .post("/credentials/status", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/revoke", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/verify", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }
    const isValid = await provider.verifyVerifiableCredential(req.body.verifiableCredential);
    res.send(isValid);
  })
  .post("/credentials/transfer", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/store", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/presentations/prove", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/presentations/present", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/presentations/verify", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  });

export = router;
