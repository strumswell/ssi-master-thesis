import { W3CCredential } from "@veramo/core";
import fetch from "node-fetch";
import { ServiceProvider } from "../ServiceProvider";

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
  async issueVerifiableCredential(body) {
    const vc: W3CCredential = body.credential;

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
    const response = await fetch(`${process.env.MATTR_URL}/v1/credentials`, {
      method: "POST",
      body: JSON.stringify(credential),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.MATTR_TOKEN}` },
    });
    const mattrVC = await response.json();
    return mattrVC;
  }

  async verifyVerifiableCredential(vc) {
    return Error("Not implemented");
  }

  async issueVerifiablePresentation(presentation) {
    return Error("Not implemented");
  }

  async verifyVerifiablePresentation(vp) {
    return Error("Not implemented");
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
}
