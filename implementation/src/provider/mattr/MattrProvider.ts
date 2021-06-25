import { VerifiableCredential, W3CCredential } from "@veramo/core";
import fetch from "node-fetch";
import { ServiceProvider } from "../ServiceProvider";
import { v4 as uuidv4 } from "uuid";
import {
  CredentialDeleteResult,
  CredentialStatusType,
  CredentialStorageResult,
  GenericMessage,
  GenericResult,
  isGenericMessage,
  isIssueCredentialRequest,
  IssueCredentialRequest,
  IssueCredentialResponse,
  Presentation,
  RevocationRequest,
  RevocationResult,
  RevocationStatus,
  VerifiablePresentation,
} from "../ServiceProviderTypes";
import { MattrVerifierService } from "./MattrVerifierService";
import * as qr from "qr-image";
import { QrCache } from "../../util/QrCache";

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

export class MattrProvider implements ServiceProvider {
  private static instance: MattrProvider; // singleton object
  private issuerQrCache: QrCache;

  private constructor() {
    this.issuerQrCache = new QrCache();
  }

  /**
   * Get singleton object
   * @returns Service object
   */
  public static getInstance(): MattrProvider {
    if (!MattrProvider.instance) {
      MattrProvider.instance = new MattrProvider();
    }
    return MattrProvider.instance;
  }

  // TODO: think about changing response schema to also include credential id (used for delete e.g.)
  async issueVerifiableCredential(
    body: IssueCredentialRequest | GenericMessage,
    toWallet: boolean
  ): Promise<IssueCredentialResponse | Buffer> {
    /**
     * Handle issuance to MATTR wallet
     */
    if (toWallet === true) {
      try {
        // There should be no credention + options body in request -> don't confuse caller
        if (isIssueCredentialRequest(body)) {
          throw Error("Issuing custom credentials to a wallet is not supported! Please define the type.");
        } else if (isGenericMessage(body)) {
          console.log("d");
          const message: GenericMessage = <GenericMessage>body; // Cast to correct type
          const qrCode: Buffer = this.getOIDCIssuerQRCode(message.from);
          return qrCode;
        } else {
          throw Error("Please define OIDC issuer id in 'from'.");
        }
      } catch (error) {
        return error;
      }
    }

    const request: IssueCredentialRequest = <IssueCredentialRequest>body; // Cast to correct type
    const vc: W3CCredential = <W3CCredential>request.credential;
    const save: boolean = request.options.save ? request.options.save : false;
    const authToken = await this.getBearerToken();

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
      const json = await response.json();
      const mattrVC: IssueCredentialResponse = { credential: json.credential };

      if (json.message) throw Error(json.message); // Handle error from MATTR

      return mattrVC;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(body: W3CCredential): Promise<GenericResult> {
    const vc = { credential: body };
    const authToken: string = await this.getBearerToken();
    const result: GenericResult = {
      success: null,
    };

    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/credentials/verify`, {
        method: "POST",
        body: JSON.stringify(vc),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const verificationResult = await response.json();
      result.success = verificationResult.verified;
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
    const authToken = await this.getBearerToken();

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

  async verifyVerifiablePresentation(body: VerifiablePresentation): Promise<GenericResult> {
    const request = { presentation: body };
    const authToken: string = await this.getBearerToken();
    const result: GenericResult = {
      success: null,
    };

    try {
      const response = await fetch(`${process.env.MATTR_URL}/core/v1/presentations/verify`, {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
      const verificationResult = await response.json();
      result.success = verificationResult.verified;
      result.error = verificationResult.reason;
      return result;
    } catch (error) {
      return error;
    }
  }

  async revokeVerifiableCredential(body: RevocationRequest): Promise<RevocationResult> {
    const request = { isRevoked: body[0].credentialStatus.status === "1" };
    const authToken = await this.getBearerToken();
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
    const authToken = await this.getBearerToken();
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

  async createPresentationRequest(request: GenericMessage): Promise<Buffer> {
    try {
      const verifierService: MattrVerifierService = MattrVerifierService.getInstance();
      const data: Buffer = await verifierService.generateQRCode(request);
      return data;
    } catch (error) {
      return error;
    }
  }

  // TODO: implement
  async presentPresentation(request: GenericMessage): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No implementation yet");
    }).catch((error) => {
      return error;
    });
  }
  async deriveVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No MATTR implementation");
    }).catch((error) => {
      return error;
    });
  }

  async transferVerifiableCredential(credential: GenericMessage): Promise<any> {
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
  public async getBearerToken(): Promise<string> {
    const requestBody = {
      client_id: process.env.MATTR_CLIENT_ID,
      client_secret: process.env.MATTR_CLIENT_SECRET,
      audience: "https://vii.mattr.global",
      grant_type: "client_credentials",
    };
    const response = await fetch("https://auth.mattr.global/oauth/token", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    const json = await response.json();
    return json.access_token;
  }

  private getOIDCIssuerQRCode(oidcIssuer: string): Buffer {
    if (this.issuerQrCache.has(oidcIssuer)) return this.issuerQrCache.get(oidcIssuer).image;

    const qrcode: Buffer = qr.imageSync(
      `openid://discovery?issuer=${process.env.MATTR_URL}/ext/oidc/v1/issuers/${oidcIssuer}`,
      { type: "png" }
    );
    this.issuerQrCache.set(oidcIssuer, qrcode);
    return qrcode;
  }
}
