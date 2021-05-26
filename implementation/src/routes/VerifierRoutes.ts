import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { VerificationResult } from "../provider/ServiceProviderTypes";
import { providerCheck } from "../util/ProviderCheckMiddleware";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * TODO:
 *  - Create types to generalize return/ request types
 */
router
  .post("/credentials/verify", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const isValid: VerificationResult = await provider.verifyVerifiableCredential(req.body.verifiableCredential);
    if (isValid instanceof Error) {
      res.status(500).send({ error: isValid.message });
    } else {
      res.status(200).send(isValid);
    }
  })
  .post("/presentations/verify", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const isValid: VerificationResult = await provider.verifyVerifiablePresentation(req.body.verifiablePresentation);
    if (isValid instanceof Error) {
      res.status(500).send({ error: isValid.message });
    } else {
      res.status(200).send(isValid);
    }
  });

export = router;
