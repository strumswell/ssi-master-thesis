import express from "express";
import { AzureProvider } from "../../provider/azure/AzureProvider";

const router = express.Router();
const azure = AzureProvider.getInstance();

router.get("/issue-request.jwt", async (req, res) => {
  const azure = AzureProvider.getInstance();
  const request = azure.issuanceRequests.get(req.query.id);
  res.send(request);
});

export = router;
