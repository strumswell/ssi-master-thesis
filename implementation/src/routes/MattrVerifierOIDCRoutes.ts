import express from "express";
import { MattrVerifierService } from "../provider/mattr/MattrVerifierService";

const router = express.Router();
const verifierService: MattrVerifierService = MattrVerifierService.getInstance();

router
  .get("/qr", (req, res) => {
    res.redirect(verifierService.getJwsURL());
  })
  .post("/callback", function (req, res) {
    const body = req.body;
    console.log("\n Data from the Presentation is shown below \n", body);
    res.sendStatus(200);
  });

export = router;
