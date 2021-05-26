import { W3CCredential } from "@veramo/core";
import fetch from "node-fetch";
import { ServiceProvider } from "../ServiceProvider";
import {
  CredentialIssuanceRequest,
  Presentation,
  VerifiablePresentation,
  VerificationResult,
} from "../ServiceProviderTypes";
import { v4 as uuidv4 } from "uuid";

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
 *  - Automate bearer token retrieval
 */
export class MattrProvider implements ServiceProvider {
  tokenRequestPromise;

  constructor() {
    this.tokenRequestPromise = this.requestBearerToken();
  }

  async issueVerifiableCredential(body: CredentialIssuanceRequest): Promise<W3CCredential> {
    const vc: W3CCredential = body.credential;
    const authToken = await (await (await this.tokenRequestPromise).json()).access_token;

    // Restructure json to fit MATTR request schema
    const credential: MattrCredentialRequest = {
      "@context": vc["@context"],
      type: vc.type,
      issuer: {
        id: vc.issuer,
        name: "tenant",
      },
      subjectId: vc.credentialSubject.id,
      claims: vc.credentialSubject[Object.keys(vc.credentialSubject)[1]],
      persist: false,
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
      const response = await fetch(`${process.env.MATTR_URL}/v1/credentials`, {
        method: "POST",
        body: JSON.stringify(credential),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
      });
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
      const response = await fetch(`${process.env.MATTR_URL}/v1/credentials/verify`, {
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
      const response = await fetch(`${process.env.MATTR_URL}/v1/presentations`, {
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
      const response = await fetch(`${process.env.MATTR_URL}/v1/presentations/verify`, {
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

  async revokeVerifiableCredential(revocationBody) {
    return Error("Not implemented");
  }

  async storeVerifiableCredential(verifiableCredential) {
    return Error("Not implemented");
  }

  async deleteVerifiableCredential(identifier) {
    return Error("Not implemented");
  }

  async isRevocable(vc: W3CCredential) {
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

  private requestBearerToken() {
    const requestBody = {
      client_id: process.env.MATTR_CLIENT_ID,
      client_secret: process.env.MATTR_CLIENT_SECRET,
      audience: "https://vii.mattr.global",
      grant_type: "client_credentials",
    };
    console.log(requestBody);
    const response = fetch("https://auth.mattr.global/oauth/token", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: { "Content-Type": "application/json" },
    });
    return response;
  }
}
