import { ServiceProvider, DidMethod } from "../ServiceProvider";
import { veramoAgent } from "./VeramoSetup";
import { IIdentifier, W3CCredential } from "@veramo/core";
import { VeramoRevoker } from "./VeramoRevoker";
import { VeramoDatabase } from "./VeramoDatabase";
import { CredentialIssuanceRequest, CredentialVerificationResult } from "../ServiceProviderTypes";

/**
 * Issue VC: ✔️
 * Issue VP: ✔️
 * Verify VC: ✔️ (Veramo is working on dedicated interface in contrast to handleMessage)
 * Verify VP: ✔️ (Not working for did:key (Ed25519 keys in general?))
 * Store VC: ✔️
 * Delete VC: ✔️ (no method, directly accessing sqlite db)
 * Revoke VC: ✔️ (no method, implemented through https://github.com/uport-project/ethr-status-registry
 * Transfer VC: ⤫
 * Derive VC: … On hold (there is no standard conform JSON-LD derivce/ SDR support, VCs are atomic though)
 * Present VP: … On hold (SDR flow could be used as an present flow)
 *
 * TODO: adjust vc issuance to take note of revocation info + check while verifying VC/ VP + redo error handling
 */
export class VeramoProvider implements ServiceProvider {
  async issueVerifiableCredential(vc: CredentialIssuanceRequest): Promise<W3CCredential> {
    vc.credential.issuer = { id: vc.credential.issuer.toString() };
    const credential: W3CCredential = await vc.credential;

    try {
      const verifiableCredential: W3CCredential = await veramoAgent.createVerifiableCredential({
        save: false,
        credential,
        proofFormat: "jwt",
      });
      return verifiableCredential;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(vc): Promise<CredentialVerificationResult> {
    const result: CredentialVerificationResult = {
      verified: false,
    };
    try {
      const message = await veramoAgent.handleMessage({
        raw: vc.proof.jwt,
      });
      // agent only checks if jwt is valid
      // we still need to manually check the integrity of the vc itself
      result.verified = await this.areCredentialParamsValid(vc, message);
      return result;
    } catch (error) {
      return error;
    }
  }

  async issueVerifiablePresentation(presentation) {
    try {
      const vp = await veramoAgent.createVerifiablePresentation({
        save: false,
        presentation: {
          holder: presentation.holder,
          verifier: presentation.holder,
          tag: new Date().getTime().toString(),
          "@context": presentation["@context"],
          type: presentation.type,
          issuanceDate: presentation.issuanceDate,
          verifiableCredential: presentation.verifiableCredential,
        },
        proofFormat: "jwt",
      });
      return vp;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiablePresentation(vp) {
    try {
      //console.log(presentation.proof.jwt);
      const message = await veramoAgent.handleMessage({
        raw: vp.proof.jwt,
      });
      // agent only checks if jwt is valid
      // we still need to manually check the integrity of the vc itself
      //const valid = await this.areCredentialParamsValid(vc, message);
      return { message };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async revokeVerifiableCredential(revocationBody) {
    const revoker = new VeramoRevoker(revocationBody.credentialId);
    const txHash = await revoker.revokeEthrCredential();
    return { txHash: txHash };
  }

  async storeVerifiableCredential(verifiableCredential) {
    try {
      const hash = await veramoAgent.dataStoreSaveVerifiableCredential({ verifiableCredential });
      return hash;
    } catch (error) {
      return error;
    }
  }

  async deleteVerifiableCredential(identifier) {
    const db = new VeramoDatabase();
    const isDeleted = db.deleteCredential(identifier);
    return { deleted: isDeleted[0], message: isDeleted[1] };
  }

  /**
   * Get all DIDs registered with Veramo agent from local KMS
   * @returns dids
   */
  async getDids(): Promise<IIdentifier[]> {
    const identifiers = await veramoAgent.didManagerFind();
    return identifiers;
  }

  async resolveDID(did: string) {
    const doc = await veramoAgent.resolveDid({
      didUrl: did,
    });
    return doc;
  }

  /**
   * Create a DID with Veramo agent in local KMS
   * @returns did
   */
  async createDid(didMethod: DidMethod): Promise<IIdentifier> {
    const identity = await veramoAgent.didManagerCreate({
      provider: `did:${didMethod}`,
    });
    return identity;
  }

  /**
   * Delete a DID with Veramo agent from local KMS
   * @param did to be deleted DID
   * @returns success
   */
  async deleteDid(did: string): Promise<boolean> {
    const identity = await veramoAgent.didManagerDelete({ did: did });
    return identity;
  }

  /**
   * Check if params of input credential and decoded jwt proof match
   * TODO: This can be done more elegant.
   * @param credential Input credential
   * @param decodedJwt Decoded jwt proof of input credential
   * @returns
   */
  async areCredentialParamsValid(credential, decodedJwt): Promise<boolean> {
    // Check subject id
    if (credential.credentialSubject.id != decodedJwt.data.sub) {
      return false;
    }
    // Check subject
    delete credential.credentialSubject.id;
    if (JSON.stringify(credential.credentialSubject) != JSON.stringify(decodedJwt.data.vc.credentialSubject))
      return false;
    // Check context
    if (credential["@context"].toString() != decodedJwt.data.vc["@context"].toString()) return false;
    // Check issuer
    if (credential.issuer.id != decodedJwt.data.iss) return false;
    // Check date
    const credentialDate = Date.parse(credential.issuanceDate).toString();
    if (credentialDate != (await this.reformatTimestamp(decodedJwt.data.nbf.toString()))) return false;
    // Check id
    if (credential.id != decodedJwt.data.jti) return false;
    // Check type
    if (credential.type.toString() != decodedJwt.data.vc.type.toString()) return false;
    // All good
    return true;
  }

  /**
   * Concat zeros to timestamp to meet standard length for JS
   * @param timestamp Timestamp of e.g. jwt proof
   * @returns
   */
  private async reformatTimestamp(timestamp): Promise<string> {
    const length = 13;
    const timestampLength = timestamp.toString().length;
    const missingZeros = length - timestampLength;
    let newTimestamp = timestamp;
    for (let i = 0; i < missingZeros; i++) {
      newTimestamp += "0";
    }
    return newTimestamp;
  }
}
