import { VerifiableCredential, W3CCredential } from "@veramo/core";
import fetch from "node-fetch";
import { ServiceProvider } from "../ServiceProvider";
import { v4 as uuidv4 } from "uuid";
import {
  CredentialDeleteResult,
  CredentialIssuanceRequest,
  CredentialStatusType,
  CredentialStorageResult,
  SupportedWalletCredential,
  Presentation,
  RevocationRequest,
  RevocationResult,
  RevocationStatus,
  VerifiablePresentation,
  VerificationResult,
  PresentationRequest,
} from "../ServiceProviderTypes";
import { MattrVerifierService } from "./MattrVerifierService";
import * as qr from "qr-image";

interface MattrCredentialRequest {
  "@context": string[];
  subjectId: string;
  type: string[];
  claims: { [x: string]: any };
  issuer: { id: any; name: string };
  persist: boolean;
  tag?: string;
  revocable: boolean;
}

/**
 * TODO:
 *  - Implement other methods
 */
export class MattrProvider implements ServiceProvider {
  tokenRequestPromise;

  constructor() {
    // Request a bearer auth token Promise
    this.tokenRequestPromise = MattrProvider.requestBearerToken();
  }

  // TODO: think about changing response schema to also include credential id (used for delete e.g.)
  async issueVerifiableCredential(body: CredentialIssuanceRequest, toWallet: boolean): Promise<W3CCredential | Buffer> {
    /**
     * Handle issuance to MATTR wallet
     */
    if (toWallet === true) {
      try {
        // There should be no credention + options body in request -> don't confuse caller
        if (body.credential && body.options) {
          throw Error("Issuing custom credentials to a wallet is not supported! Please define the type.");
        } else if (body.credentialType) {
          const qrCode: Buffer = this.getOIDCIssuerQRCode(body.credentialType);
          return qrCode;
        } else {
          throw Error("Please define the credential type.");
        }
      } catch (error) {
        return error;
      }
    }

    const vc: W3CCredential = body.credential;
    const save: boolean = body.options.save ? body.options.save : false;
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;

    /**
     * Handle custom VC issuance
     */
    // Restructure json to fit MATTR request schema
    const claims = () => {
      const copy = { ...vc };
      delete copy.credentialSubject.id;
      return copy.credentialSubject;
    };

    const credential: MattrCredentialRequest = {
      "@context": vc["@context"],
      type: vc.type,
      issuer: {
        id: vc.issuer.id ? vc.issuer.id : vc.issuer,
        name: "tenant",
      },
      subjectId: vc.credentialSubject.id,
      claims: claims(),
      persist: save,
      revocable: false,
    };

    console.log(credential);

    // Check if credential should be revocable
    try {
      if (await this.isRevocable(vc)) {
        credential.revocable = true;
      } else {
        credential.revocable = false;
      }
    } catch (error) {
      return error;
    }

    // Issue credential via MATTR platform
    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/credentials`, {
        method: "POST",
        body: JSON.stringify(credential),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      console.log(response);
      const mattrVC: W3CCredential = (await response.json()).credential;
      return mattrVC;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(body: W3CCredential): Promise<VerificationResult> {
    const vc = { credential: body };
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;
    const result: VerificationResult = {
      verified: false,
    };

    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/credentials/verify`, {
        method: "POST",
        body: JSON.stringify(vc),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const verificationResult = await response.json();
      result.verified = verificationResult.verified;
      result.error = verificationResult.error;
      return result;
    } catch (error) {
      return error;
    }
  }

  async issueVerifiablePresentation(body: Presentation): Promise<VerifiablePresentation> {
    // Prepare payload
    const request = {
      domain: "philipp-bolte-sandbox.vii.mattr.global",
      holderDidUrl: body.holder,
      credentials: body.verifiableCredential,
      challenge: uuidv4(),
    };
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;

    // Issue presentation via MATTR platform
    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/presentations`, {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const mattrVP: VerifiablePresentation = (await response.json()).presentation;
      return mattrVP;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiablePresentation(body: VerifiablePresentation): Promise<VerificationResult> {
    const request = { presentation: body };
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;
    const result: VerificationResult = {
      verified: false,
    };

    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/presentations/verify`, {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const verificationResult = await response.json();
      result.verified = verificationResult.verified;
      result.error = verificationResult.reason;
      return result;
    } catch (error) {
      return error;
    }
  }

  async revokeVerifiableCredential(body: RevocationRequest): Promise<RevocationResult> {
    const request = { isRevoked: body[0].credentialStatus.status === "1" };
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;
    const result: RevocationResult = { status: null };

    if (body.credentialStatus[0].type !== CredentialStatusType["RevocationList2020Status"]) {
      result.status = RevocationStatus.NOT_REVOKED;
      result.message = "Unsupported type or status.";
      return result;
    }

    try {
      const response = await fetch(
        `${process.env.MATTR_URL}/core/v1/credentials/${body.credentialId}/revocation-status`,
        {
          method: "POST",
          body: JSON.stringify(request),
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        }
      );
      result.status = request.isRevoked ? RevocationStatus.REVOKED : RevocationStatus.NOT_REVOKED;
      return result;
    } catch (error) {
      return error;
    }
  }

  async storeVerifiableCredential(verifiableCredential: VerifiableCredential): Promise<CredentialStorageResult> {
    return new Promise<CredentialStorageResult>(() => {
      throw new Error("No MATTR implementation");
    }).catch((error) => {
      return error;
    });
  }

  async deleteVerifiableCredential(identifier: string): Promise<CredentialDeleteResult> {
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;
    const result: CredentialDeleteResult = { isDeleted: false };
    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/credentials/${identifier}/`, {
        method: "DELETE",
        headers: { Accept: "application/json", Authorization: `Bearer ${authToken}` },
      });
      response.status === 204 ? (result.isDeleted = true) : (result.isDeleted = false);
      // Handle errors coming from MATTR
      if (response.status === 400 || response.status === 404) {
        const json = await response.json();
        throw new Error(json.message);
      }
      return result;
    } catch (error) {
      return error;
    }
  }

  public async presentVerifiablePresentation(presentationRequest: PresentationRequest): Promise<any> {
    try {
      if (presentationRequest.presentation)
        throw Error("Presenting raw verifiable presentations is not supported with MATTR.");
      if (presentationRequest.credentialType !== SupportedWalletCredential.MastersDegree)
        throw Error("Unsupported credential type");

      // TODO: Allow presenting other credentials. I only have MastersDegree @ MATTR atm -> create other type?
      const verifierService: MattrVerifierService = MattrVerifierService.getInstance();
      const data = await verifierService.generateQRCode();
      return data;
    } catch (error) {
      return error;
    }
  }

  public async deriveVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No MATTR implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async transferVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No MATTR implementation");
    }).catch((error) => {
      return error;
    });
  }

  /**
   * Check if input credential should be revocable based on its attributes
   * @param vc Credential that has to be checked
   * @returns boolean
   */
  private async isRevocable(vc: W3CCredential) {
    const revocable = vc.credentialStatus !== undefined ? true : false;
    const hasCorrectType = revocable && vc.credentialStatus.type == "RevocationList2020Status" ? true : false;

    if (revocable && hasCorrectType) {
      return true;
    } else if (!revocable) {
      return false;
    } else {
      return Error("Revocation type not supported");
    }
  }

  /**
   * Request bearer auth token from MATTR
   * @returns Promise of MATTR auth request. Token under .access_token
   */
  public static requestBearerToken(): Promise<any> {
    const requestBody = {
      client_id: process.env.MATTR_CLIENT_ID,
      client_secret: process.env.MATTR_CLIENT_SECRET,
      audience: "https://vii.mattr.global",
      grant_type: "client_credentials",
    };
    const response = fetch("https://auth.mattr.global/oauth/token", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    return response;
  }

  private getOIDCIssuerQRCode(credentialType: SupportedWalletCredential): Buffer {
    const supportedCredentials = new Map([
      [
        SupportedWalletCredential.MastersDegree,
        `${process.env.MATTR_URL}/ext/oidc/v1/issuers/b9dc6529-7796-4b77-9249-8387974cc761`,
      ],
    ]);

    if (supportedCredentials.has(credentialType)) {
      const issuerUrl = supportedCredentials.get(credentialType);
      const qrcode: Buffer = qr.imageSync(`openid://discovery?issuer=${issuerUrl}`, { type: "png" });
      return qrcode;
    } else {
      throw Error("Unsupported credential type. Check docs!");
    }
  }
}
