import express from "express";
import { DidMethod } from "../../provider/ServiceProvider";
import { VeramoRevoker } from "../../provider/veramo/VeramoRevoker";
import { VeramoProvider } from "../../provider/veramo/VeramoProvider";
import { VeramoDatabase, VeramoDatabaseCredential } from "../../provider/veramo/VeramoDatabase";
import { DIDCommMessage } from "../../provider/ServiceProviderTypes";

const router = express.Router();
const veramo = new VeramoProvider();
const db = new VeramoDatabase();
/**
 * DID Util Routes
 * ----------------------------------------------------
 * Those are independent of VC HTTP API and are
 * only implemented for convenience during development
 */
router
  .get("/dids/", async (req, res) => {
    const identifiers = await veramo.getDids();
    res.send({ identifiers });
  })
  .get("/dids/create", async (req, res) => {
    const identifier = await veramo.createDid(DidMethod.KEY);
    res.send({ identifier });
  })
  .get("/dids/delete", async (req, res) => {
    const did = req.query.did;
    try {
      const result = await veramo.deleteDid(did);
      res.status(200).send({ result });
    } catch (error) {
      res.status(400).send({ error: error.message });
    }
  })
  .get("/dids/resolve", async (req, res) => {
    const did = req.query.did;
    res.send(await veramo.resolveDID(did));
  })
  .get("/credentials", async (req, res) => {
    const vcs: [VeramoDatabaseCredential] = await db.getAllCredentials();
    res.send(vcs);
  })
  .get("/credentials/delete", async (req, res) => {
    const hash = req.query.hash;
    const isExecuted = await db.deleteCredential(hash);
    res.send(isExecuted);
  })
  .get("/credentials/:hash/revocation-status", async (req, res) => {
    const hash = req.params.hash;
    const revoker = new VeramoRevoker(hash);
    res.send(await revoker.getEthrCredentialStatus());
  })
  .post("/sdr", async (req, res) => {
    const sdr: DIDCommMessage = req.body;
    const message = await veramo.createPresentationRequestDemo(sdr);
    res.send(message);
  });

export = router;
