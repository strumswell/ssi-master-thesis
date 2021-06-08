import fetch from "node-fetch";
import * as qr from "qr-image";
import { MattrProvider } from "./MattrProvider";

/**
 * Starts a public proxy to local API and handle the generation
 * of QR codes containing a presentation request that can be
 * used with the MATTR wallet app.
 *
 * Logic heavily based on https://github.com/mattrglobal/sample-apps/tree/main/verify-callback-express
 */
export class MattrVerifierService {
  private static verifierService: MattrVerifierService; // singleton object
  private tenant: string = process.env.MATTR_TENANT;
  private tokenRequestPromise: Promise<any>;
  private qrCode: any;

  private jwsUrl: string;
  private publicUrl = `${process.env.LOCAL_DEV_URL}:3000`;

  private constructor() {
    this.tokenRequestPromise = MattrProvider.requestBearerToken();
  }

  /**
   * Get singleton object
   * @returns Service object
   */
  public static getInstance(): MattrVerifierService {
    if (!MattrVerifierService.verifierService) {
      MattrVerifierService.verifierService = new MattrVerifierService();
    }
    return MattrVerifierService.verifierService;
  }

  /**
   * Get jws request URL of MATTR tenant of presentation request
   * @returns jws url
   */
  public getJwsURL(): string {
    return this.jwsUrl;
  }

  private async provisionPresentationRequest(publicUrl) {
    const bearerToken = await (await (await this.tokenRequestPromise).json()).access_token;
    const url = `https://${this.tenant}/core/v1/presentations/requests`;
    const presResponse: any = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearerToken}` },
      body: JSON.stringify({
        challenge: "GW8FGpP6jhFrl37yQZIM6w",
        did: process.env.MATTR_VERIFIERDID,
        templateId: process.env.MATTR_TEMPLATEID,
        expiresTime: 1638836401000, // TODO: Custom expire time, 1h?
        callbackUrl: `${publicUrl}/mattr/verifier/callback`,
      }),
    });
    const requestPayload = (await presResponse.json()).request;
    return requestPayload;
  }

  private async getVerifierDIDUrl() {
    const bearerToken = await (await (await MattrProvider.requestBearerToken()).json()).access_token;
    const url = `https://${this.tenant}/core/v1/dids/` + process.env.MATTR_VERIFIERDID;

    const didResponse: any = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const auth = (await didResponse.json()).didDocument.authentication[0];
    return auth;
  }

  private async signPayload(publicUrl, didUrl, requestPayload) {
    const bearerToken = await (await (await MattrProvider.requestBearerToken()).json()).access_token;

    const url = `https://${this.tenant}/core/v1/messaging/sign`;

    const signResponse: any = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearerToken}` },
      body: JSON.stringify({
        didUrl: didUrl,
        payload: requestPayload,
      }),
    });
    const jws = await signResponse.json();
    this.jwsUrl = `https://${this.tenant}/?request=${jws}`;

    const didcommUrl = `didcomm://${publicUrl}/mattr/verifier/qr`;
    return didcommUrl;
  }

  /**
   * Generate a QR code that kicks off a presentation flow via OIDC bridge and MATTR wallet
   * @returns SVG qr code of presentation request
   */
  public async generateQRCode(): Promise<any> {
    if (this.qrCode !== undefined) return this.qrCode; // return cached qr code
    const publicUrl = this.publicUrl;
    const provisionRequest = await this.provisionPresentationRequest(publicUrl);
    const didUrl = await this.getVerifierDIDUrl();
    const didcommUrl = await this.signPayload(publicUrl, didUrl, provisionRequest);
    const qrcode = qr.imageSync(didcommUrl, { type: "png" });
    return qrcode;
  }
}
