import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { GenericMessage, GenericResult, isGenericResult } from "../provider/ServiceProviderTypes";
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

    const result: GenericResult = await provider.verifyVerifiableCredential(req.body.verifiableCredential);
    if (result instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: result.message });
    } else {
      res.status(200).send(result);
    }
  })
  .post("/presentations/verify", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const result: GenericResult = await provider.verifyVerifiablePresentation(req.body.verifiablePresentation);
    if (result instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: result.message });
    } else {
      res.status(200).send(result);
    }
  })
  .post("/presentations/request", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const request: GenericMessage = req.body;

    const result: Buffer | GenericResult = await provider.createPresentationRequest(request);

    if (result instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: result.message });
    } else if (isGenericResult(result)) {
      res.status(200).send(result);
    } else {
      res.type("png");
      res.status(200).send(result);
    }
  });

export = router;
