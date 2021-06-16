import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import {
  CredentialDeleteResult,
  CredentialStorageResult,
  GenericMessage,
  GenericResult,
  isGenericResult,
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
  .post("/credentials/derive", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const result = await provider.deriveVerifiableCredential(req.body);
    if (result instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: result.message });
    } else {
      res.status(200).send(result);
    }
  })
  .post("/credentials/store", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const result: CredentialStorageResult = await provider.storeVerifiableCredential(req.body.credential);
    if (result instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: result.message });
    } else {
      res.status(201).send(result);
    }
  })
  .post("/credentials/transfer", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const result = await provider.transferVerifiableCredential(req.body);
    if (result instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: result.message });
    } else {
      res.status(200).send(result);
    }
  })
  .delete("/credentials/delete/:id", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);

    const result: CredentialDeleteResult = await provider.deleteVerifiableCredential(req.params.id);
    if (result instanceof Error) {
      res.status(400).send(<GenericResult>{ success: false, error: result.message });
    } else {
      res.status(200).send(result);
    }
  })
  .post("/presentations/prove", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const presentation: Presentation = req.body.presentation;
    const vp: VerifiablePresentation = await provider.issueVerifiablePresentation(presentation);

    if (vp instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: vp.message });
    } else {
      res.status(201).send(vp);
    }
  })
  .post("/presentations/present", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const request: GenericMessage = req.body;

    const presentationRequest: Buffer | GenericResult = await provider.createPresentationRequest(request);

    if (presentationRequest instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: presentationRequest.message });
    } else if (isGenericResult(presentationRequest)) {
      res.status(200).send(presentationRequest);
    } else {
      res.type("png");
      res.status(200).send(presentationRequest);
    }
  });

export = router;
