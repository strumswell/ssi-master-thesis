import express from "express";
import { ServiceProviderFactory, ServiceType } from "../provider/ServiceProviderFactory";
import { DidMethod } from "../provider/ServiceProvider";

const router = express.Router();
const provider = new ServiceProviderFactory().createProvider(ServiceType.VERAMO);

/**
 * DID Util Routes
 * ----------------------------------------------------
 * Those are independent of VC HTTP API and are
 * only implemented for convenience during development
 */
router
  .get("/dids/", async (req, res) => {
    const identifiers = await provider.getDids();
    res.send({ identifiers });
  })
  .get("/dids/create", async (req, res) => {
    const identifier = await provider.createDid(DidMethod.ION);
    res.send({ identifier });
  });

export = router;
