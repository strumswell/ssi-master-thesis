import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { GenericResult, IssueCredentialResponse, RevocationResult } from "../provider/ServiceProviderTypes";
import { providerCheck } from "../util/ProviderCheckMiddleware";

const router = express.Router();
const factory = new ServiceProviderFactory();

/**
 * TODO:
 *  - Do error handling on provider level (see /credentials/status)
 *  - Create types to generalize return/ request types
 */
router
  .post("/credentials/issue", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const credential: IssueCredentialResponse | Buffer = await provider.issueVerifiableCredential(
      req.body,
      req.query.toWallet === "true"
    );

    if (credential instanceof Error) {
      res.status(500).send(<GenericResult>{ success: false, error: credential.message });
    } else if (credential instanceof Buffer) {
      res.type("png");
      res.status(200).send(credential);
    } else {
      res.status(201).send(credential);
    }
  })
  .post("/credentials/status", providerCheck, async (req, res) => {
    const provider = factory.createProvider(ServiceType[req.query.provider.toUpperCase()]);
    const result: RevocationResult = await provider.revokeVerifiableCredential(req.body);
    res.status(200).send(result);
  });

export = router;
