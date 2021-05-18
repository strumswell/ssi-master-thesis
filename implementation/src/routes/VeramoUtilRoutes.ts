import express from "express";
import { DidMethod } from "../provider/ServiceProvider";
import { EthrVCRevoker } from "../provider/veramo/EthrVCRevoker";
import { VeramoProvider } from "../provider/veramo/VeramoProvider";

const router = express.Router();
const veramo = new VeramoProvider();
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
    const identifier = await veramo.createDid(DidMethod.ETHR);
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
  .get("/credentials/revocationStatus", async (req, res) => {
    const hash = req.query.hash;
    const revoker = new EthrVCRevoker(hash);
    res.send(await revoker.getEthrCredentialStatus());
  });

export = router;