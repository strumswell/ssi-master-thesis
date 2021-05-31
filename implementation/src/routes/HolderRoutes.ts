import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import {
  CredentialDeleteResult,
  CredentialStorageResult,
  Presentation,
  VerifiablePresentation,
} from "../provider/ServiceProviderTypes";
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

    const result: CredentialStorageResult = await provider.storeVerifiableCredential(req.body.credential);
    if (result instanceof Error) {
      res.status(500).send({ error: result.message });
    } else {
      res.status(201).send(result);
    }
  })
  .delete("/credentials/delete/:id", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const result: CredentialDeleteResult = await provider.deleteVerifiableCredential(req.params.id);
    if (result instanceof Error) {
      res.status(400).send({ error: result.message });
    } else {
      res.status(200).send(result);
    }
  })
  .post("/presentations/prove", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const presentation: Presentation = req.body.presentation;
    const vp: VerifiablePresentation = await provider.issueVerifiablePresentation(presentation);

    if (vp instanceof Error) {
      res.status(500).send({ error: vp.message });
    } else {
      res.status(201).send(vp);
    }
  })
  .post("/presentations/present", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const qrCode = await provider.presentVerifiablePresentation();
    res.type("png");
    res.send(qrCode);
  });

export = router;
