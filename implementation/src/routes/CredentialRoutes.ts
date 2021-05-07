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
    switch (req.query.provider.toLowerCase()) {
      case ServiceType.VERAMO: {
        let provider = factory.createProvider(ServiceType.VERAMO);
        let credential = await provider.issueVerifiableCredential(req.body);
        if (credential instanceof Error) {
          res.status(500).send({ error: credential.message });
        } else {
          res.status(201).send({ credential });
        }
        break;
      }
      default: {
        res.status(400).send({ error: "Unknown Provider" });
      }
    }
  })
  .post("/credentials/status", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/revoke", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/verify", async (req, res) => {
    switch (req.query.provider.toLowerCase()) {
      case ServiceType.VERAMO: {
        let provider = factory.createProvider(ServiceType.VERAMO);
        let isValid = await provider.verifyVerifiableCredential(req.body.verifiableCredential);
        res.send(isValid);
        break;
      }
      default: {
        res.status(400).send({ error: "Unknown Provider" });
      }
    }
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
