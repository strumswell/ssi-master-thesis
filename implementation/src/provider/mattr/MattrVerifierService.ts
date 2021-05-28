import ngrok from "ngrok";
import got from "got";
import express from "express";
import QRCode from "qrcode";
import { MattrProvider } from "../provider/mattr/MattrProvider";

// Heavily based on https://github.com/mattrglobal/sample-apps/tree/main/verify-callback-express
export class MattrVerifierService {
  tenant: string = process.env.MATTR_TENANT;
  jwsUrl: string;
  tokenRequestPromise;

  constructor() {
    // Request a bearer auth token Promise
    this.tokenRequestPromise = MattrProvider.requestBearerToken();
  }

  async startNgrok() {
    const ngrokUrl = await ngrok.connect(3000);
    return ngrokUrl;
  }

  private async provisionPresentationRequest(ngrokUrl) {
    const bearerToken = await (await (await this.tokenRequestPromise).json()).access_token;
    const presReq = `https://${this.tenant}/core/v1/presentations/requests`;
    //console.log("Creating Presentation Request at ", presReq);

    const presResponse: any = await got.post(presReq, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      json: {
        challenge: "GW8FGpP6jhFrl37yQZIM6w",
        did: process.env.MATTR_VERIFIERDID,
        templateId: process.env.MATTR_TEMPLATEID,
        expiresTime: 1638836401000,
        callbackUrl: `${ngrokUrl}/mattr/verifier/callback`,
      },
      responseType: "json",
    });
    const requestPayload = presResponse.body.request;
    //console.log("Create Presentation Request statusCode: ", presResponse.statusCode);
    return requestPayload;
  }

  private async getVerifierDIDUrl() {
    const bearerToken = await (await (await MattrProvider.requestBearerToken()).json()).access_token;
    const dids = `https://${this.tenant}/core/v1/dids/` + process.env.MATTR_VERIFIERDID;
    //console.log("Looking up DID Doc from Verifier DID :", dids);

    const didResponse: any = await got.get(dids, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      responseType: "json",
    });
    //console.log("Public key from DID Doc found, DIDUrl is: ", didResponse.body.didDocument.authentication[0], "\n");
    return didResponse.body.didDocument.authentication[0]; //didurl
  }

  private async signPayload(ngrokUrl, didUrl, requestPayload) {
    const bearerToken = await (await (await MattrProvider.requestBearerToken()).json()).access_token;

    const signMes = `https://${this.tenant}/core/v1/messaging/sign`;
    //console.log("Signing the Presentation Request payload at: ", signMes);

    const signResponse: any = await got.post(signMes, {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
      json: {
        didUrl: didUrl,
        payload: requestPayload,
      },
      responseType: "json",
    });
    const jws = signResponse.body;
    //console.log("The signed Presentation Request message is: ", jws, "\n");

    this.jwsUrl = `https://${this.tenant}/?request=${jws}`;

    const didcommUrl = `didcomm://${ngrokUrl}/mattr/verifier/qr`;
    //console.log("The URL encoded in this QR code", didcommUrl);
    return didcommUrl;
  }

  public async generateQRCode() {
    const ngrokUrl = await this.startNgrok();
    const provisionRequest = await this.provisionPresentationRequest(ngrokUrl);
    const didUrl = await this.getVerifierDIDUrl();
    const didcommUrl = await this.signPayload(ngrokUrl, didUrl, provisionRequest);

    QRCode.toString(didcommUrl, { type: "terminal" }, function (err, url) {
      console.log(url);
    });
  }
}

export const router = express.Router();
const service = new MattrVerifierService();
//service.generateQRCode();

router
  .get("/qr", (req, res) => {
    //console.log(service.jwsUrl);
    res.redirect(service.jwsUrl);
  })
  .get("/test", (req, res) => {
    res.sendStatus(200);
  })
  .post("/callback", function (req, res) {
    const body = req.body;
    console.log("\n Data from the Presentation is shown below \n", body);
    res.sendStatus(200);
  });
