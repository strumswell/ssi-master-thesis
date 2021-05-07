import { ServiceProvider, DidMethod } from "../ServiceProvider";
import { veramoAgent } from "./VeramoSetup";
import { W3CCredential } from "@veramo/core";

export class VeramoProvider implements ServiceProvider {
  async issueVerifiableCredential(vc) {
    try {
      vc.credential.issuer = { id: vc.credential.issuer };
      const credential: W3CCredential = await vc.credential;

      const verifiableCredential = await veramoAgent.createVerifiableCredential({
        save: false,
        credential,
        proofFormat: "jwt",
      });
      return verifiableCredential;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(vc) {
    try {
      const message = await veramoAgent.handleMessage({
        raw: vc.proof.jwt,
      });
      // agent only checks if jwt is valid
      // we still need to manually check the integrity of the vc itself
      const valid = await this.areCredentialParamsValid(vc, message);
      return {
        valid: valid,
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async getDids() {
    const identifiers = await veramoAgent.didManagerFind();
    return identifiers;
  }

  async createDid(didMethod: DidMethod) {
    const identity = await veramoAgent.didManagerCreate({
      provider: `did:${didMethod}`,
    });
    return identity;
  }

  /**
   * Check if params of input credential and decoded jwt proof match
   * @param credential Input credential
   * @param decodedJwt Decoded jwt proof of input credential
   * @returns
   */
  private async areCredentialParamsValid(credential, decodedJwt) {
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
    console.log(credential.type.toString());
    if (credential.type.toString() != decodedJwt.data.vc.type.toString()) return false;
    // All good
    return true;
  }

  /**
   * Concat zeros to timestamp to meet standard length
   * @param timestamp Timestamp of e.g. jwt proof
   * @returns
   */
  private async reformatTimestamp(timestamp) {
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
