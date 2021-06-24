import express from "express";
import { MattrProvider } from "../../provider/mattr/MattrProvider";
import fetch from "node-fetch";

const router = express.Router();
const mattr = MattrProvider.getInstance();

router
  .get("/dids", async (req, res) => {
    try {
      const authToken = await mattr.getBearerToken();
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/dids`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      res.status(200).send(await response.json());
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error });
    }
  })
  .get("/credentials", async (req, res) => {
    try {
      const authToken = await mattr.getBearerToken();
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/credentials`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      res.status(200).send(await response.json());
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error });
    }
  })
  .get("/credentials/:id/revocation-status", async (req, res) => {
    try {
      const authToken = await mattr.getBearerToken();
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/credentials/${req.params.id}/revocation-status`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      res.status(200).send(await response.json());
    } catch (error) {
      console.log(error.message);
      res.status(500).send({ error });
    }
  });

export = router;
