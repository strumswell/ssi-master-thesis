import { W3CCredential } from "@veramo/core";
import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { CredentialVerificationResult } from "../provider/ServiceProviderTypes";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * Credential Routes
 * ---------------------------------------------------
 * TODO:
 *  - Come up with a cleaner way of writing this... Split up into multiples files?
 *  - Do error handling on provider level (see /credentials/status)
 *  - Create types
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
  })
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
  .post("/credentials/transfer", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
  })
  .post("/credentials/store", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }

    const result = await provider.storeVerifiableCredential(req.body.credential);
    if (result instanceof Error) {
      res.status(500).send({ success: false, hash: "", errors: result.message });
    } else {
      res.status(201).send({ success: true, hash: result, errors: null });
    }
  })
  .post("/credentials/delete", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }
    // TODO: Redo req body in OpenAPI schema
    const result = await provider.deleteVerifiableCredential(req.body.hash);
    if (result instanceof Error) {
      res.status(500).send({ success: false, errors: result.message });
    } else {
      res.status(200).send({ success: true, errors: null });
    }
  })
  .post("/presentations/prove", async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    if (provider == null) {
      res.status(400).send({ error: "Unknown Provider" });
      return;
    }

    const vp = await provider.issueVerifiablePresentation(req.body.presentation);
    if (vp instanceof Error) {
      res.status(500).send({ error: vp });
    } else {
      res.status(201).send({ vp });
    }
  })
  .post("/presentations/present", (req, res) => {
    res.status(501).send({ error: "Not implemented" });
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
