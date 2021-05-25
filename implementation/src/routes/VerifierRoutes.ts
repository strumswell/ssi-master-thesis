import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { CredentialVerificationResult } from "../provider/ServiceProviderTypes";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * TODO:
 *  - Create types to generalize return/ request types
 */
router
  .post("/credentials/verify", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }

    const isValid: CredentialVerificationResult = await provider.verifyVerifiableCredential(
      req.body.verifiableCredential
    );
    if (isValid instanceof Error) {
      res.status(500).send({ error: isValid.message });
    } else {
      res.status(200).send(isValid);
    }
  })
  .post("/presentations/verify", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }
    const isValid = await provider.verifyVerifiablePresentation(req.body.verifiablePresentation);
    res.send(isValid);
  });

export = router;
