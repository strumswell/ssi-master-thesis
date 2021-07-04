import express from "express";
import { ValidatorBuilder } from "verifiablecredentials-verification-sdk-typescript";
import { AzureProvider } from "../../provider/azure/AzureProvider";

const router = express.Router();
const azure = AzureProvider.getInstance();

router
  .get("/issue-request.jwt", async (req, res) => {
    const request = azure.requestCache.get(req.query.id);
    res.send(request);
  })
  .get("/presentation-request.jwt", async (req, res) => {
    const request = azure.requestCache.get(req.query.id);
    res.send(request);
  })
  .post("/azure/presentation-response", async (req, res) => {
    const clientId = `${process.env.LOCAL_DEV_URL}/azure/presentation-response`;
    const issuerDid = process.env.AZURE_DID;
    const credentialType = "MastersDegree";
    const validator = new ValidatorBuilder(azure.crypto)
      .useTrustedIssuersForVerifiableCredentials({ ["MastersDegree"]: [issuerDid] }) // TODO: Think about abstracting away
      .useAudienceUrl(clientId)
      .build();

    const validationResponse = await validator.validate(req.body.id_token);

    if (!validationResponse.result) {
      console.error(`Validation failed: ${validationResponse.detailedError}`);
      return res.send();
    }

    const verifiedCredential = validationResponse.validationResult.verifiableCredentials[credentialType].decodedToken;
    console.log("Credential is valid!");
    console.log(verifiedCredential);
    res.send();
  });

export = router;
