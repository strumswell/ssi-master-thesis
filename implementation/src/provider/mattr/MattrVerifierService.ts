import fetch from "node-fetch";
import * as qr from "qr-image";
import { QrCache } from "../../util/QrCache";
import { GenericMessage } from "../ServiceProviderTypes";
import { MattrProvider } from "./MattrProvider";

/**
 * Starts a public proxy to local API and handle the generation
 * of QR codes containing a presentation request that can be
 * used with the MATTR wallet app.
 *
 * Logic heavily based on https://github.com/mattrglobal/sample-apps/tree/main/verify-callback-express
 */
export class MattrVerifierService {
  private static instance: MattrVerifierService; // singleton object
  private tenant: string;
  private jwsUrl: string;
  private qrCache: QrCache;
  private publicUrl: string;
  private mattr: MattrProvider;

  private constructor() {
    this.tenant = process.env.MATTR_TENANT;
    this.qrCache = new QrCache();
    this.publicUrl = `${process.env.LOCAL_DEV_URL}`;
    this.mattr = MattrProvider.getInstance();
  }

  /**
   * Get singleton object
   * @returns Service object
   */
  public static getInstance(): MattrVerifierService {
    if (!MattrVerifierService.instance) {
      MattrVerifierService.instance = new MattrVerifierService();
    }
    return MattrVerifierService.instance;
  }

  /**
   * Get jws request URL of MATTR tenant of presentation request
   * @returns jws url
   */
  public getJwsURL(): string {
    return this.jwsUrl;
  }

  private async provisionPresentationRequest(publicUrl: string, request: GenericMessage) {
    const bearerToken = await this.mattr.getBearerToken();
    const url = `https://${this.tenant}/core/v1/presentations/requests`;
    const presResponse: any = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearerToken}` },
      body: JSON.stringify({
        challenge: request.id,
        did: request.from,
        templateId: request.body.request.credentialType,
        expiresTime: request.expiresTime,
        callbackUrl: `${publicUrl}/mattr/verifier/callback`,
      }),
    });
    const requestPayload = (await presResponse.json()).request;
    return requestPayload;
  }

  private async getVerifierDIDUrl(did: string) {
    const bearerToken = await this.mattr.getBearerToken();
    const url = `https://${this.tenant}/core/v1/dids/${did}`;

    const didResponse: any = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const auth = (await didResponse.json()).didDocument.authentication[0];
    return auth;
  }

  private async signPayload(publicUrl, didUrl, requestPayload) {
    const bearerToken = await this.mattr.getBearerToken();

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
  public async generateQRCode(request: GenericMessage): Promise<Buffer> {
    const templateId: string = request.body.request.credentialType;
    if (this.qrCache.has(templateId)) return this.qrCache.get(templateId).image; // return caches qr code

    const publicUrl = this.publicUrl;
    const provisionRequest = await this.provisionPresentationRequest(publicUrl, request);
    const didUrl = await this.getVerifierDIDUrl(request.from);
    const didcommUrl = await this.signPayload(publicUrl, didUrl, provisionRequest);
    const qrcode = qr.imageSync(didcommUrl, { type: "png" });

    this.qrCache.set(templateId, qrcode, request.expiresTime); // cache qrcode

    return qrcode;
  }
}
