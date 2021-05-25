import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { providerCheck } from "../util/ProviderCheckMiddleware";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * TODO:
 *  - Create types to generalize return/ request types
 */
router
  .post("/credentials/transfer", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/store", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const result = await provider.storeVerifiableCredential(req.body.credential);
    if (result instanceof Error) {
      res.status(500).send({ success: false, hash: "", errors: result.message });
    } else {
      res.status(201).send({ success: true, hash: result, errors: null });
    }
  })
  .post("/credentials/delete", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    // TODO: Redo req body in OpenAPI schema
    const result = await provider.deleteVerifiableCredential(req.body.hash);
    if (result instanceof Error) {
      res.status(500).send({ success: false, errors: result.message });
    } else {
      res.status(200).send({ success: true, errors: null });
    }
  })
  .post("/presentations/prove", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const vp = await provider.issueVerifiablePresentation(req.body.presentation);
    if (vp instanceof Error) {
      res.status(500).send({ error: vp });
    } else {
      res.status(201).send({ vp });
    }
  })
  .post("/presentations/present", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  });

export = router;
