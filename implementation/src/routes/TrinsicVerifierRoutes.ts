import express from "express";
import { TrinsicProvider } from "../provider/trinsic/TrinsicProvider";

const router = express.Router();
const trinsicProvider = new TrinsicProvider();

router.post("/webhook", async (req, res) => {
  try {
    console.log("got webhook type: " + req.body.message_type);
    console.log(JSON.stringify(req.body, null, 2));
    if (req.body.message_type === "verification") {
      console.log("new verification notification");
      const verification = await trinsicProvider.client.getVerification(req.body.object_id);
      console.log(verification);
    }
  } catch (error) {
    console.log(error.message || error.toString());
  }
  res.status(200).end();
});

export = router;
