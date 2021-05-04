import express from "express";
import { ServiceProvider } from "../provider/ServiceProvider";
import { VeramoProvider } from "../provider/veramo/VeramoProvider";
const router = express.Router();

// Credential Routes
// TODO: Come up with a cleaner way of writing this...
router
  .post("/credentials/issue", async (req, res) => {
    let provider: ServiceProvider;
    if (req.body.provider == "Veramo") {
      provider = new VeramoProvider();
      let credential = await provider.issueVerifiableCredential(req.body);
      if (credential instanceof Error) {
        res.status(400).send({ error: credential.message });
      } else {
        res.status(201).send({ credential });
      }
    } else {
      res.send({ error: "Unknown Provider" });
    }
  })
  .post("/credentials/status", (req, res) => {
    res.send({ success: true });
  })
  .post("/credentials/verify", async (req, res) => {
    let provider: ServiceProvider;
    if (req.body.provider == "Veramo") {
      provider = new VeramoProvider();
      let valid = await provider.verifyVerifiableCredential(
        req.body.verifiableCredential
      );
      res.send(valid);
    } else {
      res.send({ error: "Unknown Provider" });
    }
  })
  .post("/presentations/issue", (req, res) => {
    res.send({ success: true });
  })
  .post("/presentations/verify", (req, res) => {
    res.send({ success: true });
  });

export = router;
