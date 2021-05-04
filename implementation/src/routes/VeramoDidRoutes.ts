import express from "express";
import { VeramoProvider } from "../provider/veramo/VeramoProvider";

const router = express.Router();
const veramo = new VeramoProvider();

// DID Routes
router
  .get("/dids/", async (req, res) => {
    const identifiers = await veramo.getDIDs();
    res.send({ identifiers });
  })
  .get("/dids/create", async (req, res) => {
    const identifier = await veramo.createDID();
    res.send({ identifier });
  })
  .get("/dids/resolve/:did", async (req, res) => {
    const didDocument = await veramo.resolveDID(req.params.did);
    res.send({ didDocument });
  });

export = router;
