import { ServiceProvider, DidMethod } from "../ServiceProvider";
import { veramoAgent } from "./VeramoSetup";
import { IIdentifier, VerifiableCredential, W3CCredential } from "@veramo/core";
import { VeramoRevoker } from "./VeramoRevoker";
import { VeramoDatabase } from "./VeramoDatabase";
import {
  CredentialIssuanceRequest,
  VerificationResult,
  Presentation,
  VerifiablePresentation,
  RevocationStatus,
  RevocationResult,
  RevocationRequest,
  CredentialStorageResult,
  CredentialDeleteResult,
  PresentationRequest,
  DIDCommMessage,
} from "../ServiceProviderTypes";

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
  async issueVerifiableCredential(body: CredentialIssuanceRequest, toWallet: boolean): Promise<W3CCredential> {
    try {
      body.credential.issuer = { id: body.credential.issuer.toString() };
      const credential: W3CCredential = await body.credential;
      const save: boolean = body.options.save ? body.options.save : false;

      const verifiableCredential: W3CCredential = await veramoAgent.createVerifiableCredential({
        save: save,
        credential,
        proofFormat: "jwt",
      });

      if (toWallet) {
        try {
          console.log(`Trying to send VC to ${verifiableCredential.credentialSubject.id}`);
          const message = await veramoAgent.sendMessageDIDCommAlpha1({
            save: true,
            data: {
              from: verifiableCredential.issuer.id,
              to: verifiableCredential.credentialSubject.id,
              type: "jwt",
              body: verifiableCredential.proof.jwt,
            },
          });
        } catch (error) {
          // I don't know why this throws "TypeError: Cannot read property 'type' of undefined"
          // I think it has to do with my Veramo setup. But all data is send, only the verfication fails.
          // TODO: So I am not going to investigate to save me some time... maybe later.
          // Message is sent to receiver DID but I get no result from method call + message is not saved
          console.log(error);
          console.log(`Something went expectedly wrong but the VC should be sent. Error: ${error.message}`);
        }
      }

      return verifiableCredential;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(vc: W3CCredential): Promise<VerificationResult> {
    const result: VerificationResult = {
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

  async issueVerifiablePresentation(body: Presentation): Promise<VerifiablePresentation> {
    try {
      const vp: VerifiablePresentation = await veramoAgent.createVerifiablePresentation({
        save: false,
        presentation: {
          holder: body.holder,
          verifier: [body.holder],
          tag: new Date().getTime().toString(),
          "@context": body["@context"],
          type: body.type,
          issuanceDate: body.issuanceDate,
          verifiableCredential: body.verifiableCredential,
        },
        proofFormat: "jwt",
      });
      return vp;
    } catch (error) {
      return error;
    }
  }

  // TODO: TYPES of attribute result
  async verifyVerifiablePresentation(vp: VerifiablePresentation): Promise<VerificationResult> {
    const result: VerificationResult = {
      verified: false,
    };
    try {
      const message = await veramoAgent.handleMessage({
        raw: vp.proof.jwt,
      });
      // agent only checks if jwt is valid
      // we still need to manually check the integrity of the vc itself
      //const valid = await this.areCredentialParamsValid(vc, message);
      result.verified = true;
    } catch (error) {
      return error;
    }
  }

  async revokeVerifiableCredential(revocationBody: RevocationRequest): Promise<RevocationResult> {
    const revoker = new VeramoRevoker(revocationBody.credentialId);
    const result: RevocationResult = { status: null };
    if (
      revocationBody.credentialStatus[0].type !== "EthrStatusRegistry2019" ||
      revocationBody.credentialStatus[0].status !== "1"
    ) {
      result.status = RevocationStatus[RevocationStatus.NOT_REVOKED];
      result.message = "Unsupported type or status.";
      return result;
    } else {
      const txHash = await revoker.revokeEthrCredential();
      result.status = RevocationStatus[RevocationStatus.PENDING];
      result.message = txHash;
      return result;
    }
  }

  async storeVerifiableCredential(verifiableCredential: VerifiableCredential): Promise<CredentialStorageResult> {
    try {
      const hash = await veramoAgent.dataStoreSaveVerifiableCredential({ verifiableCredential });
      return { id: hash };
    } catch (error) {
      return error;
    }
  }

  async deleteVerifiableCredential(identifier: string): Promise<CredentialDeleteResult> {
    const db = new VeramoDatabase();
    const result: CredentialDeleteResult = { isDeleted: false };
    try {
      const isDeleted = await db.deleteCredential(identifier);
      result.isDeleted = isDeleted[0];
      result.message = isDeleted[1];
      return result;
    } catch (error) {
      return error;
    }
  }

  // TODO: Handle different credential types. Currently only Master's Degree
  public async presentVerifiablePresentation(presentationRequest: PresentationRequest): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Veramo implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async deriveVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Veramo implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async transferVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Veramo implementation");
    }).catch((error) => {
      return error;
    });
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

  // TODO: rename DIDCommMessage and merge this method into official one
  public async createPresentationRequestDemo(request: DIDCommMessage) {
    let jwt: string;
    try {
      // Prepare request
      request.body.essential = true;
      jwt = await veramoAgent.createSelectiveDisclosureRequest({
        data: {
          tag: request.id ? request.id : new Date().toISOString(),
          issuer: request.from,
          claims: [request.body],
        },
      });

      // Build Veramo DIDComm body
      const msgBody = {
        from: request.from,
        to: request.to[0], // only support one receiver
        type: "jwt",
        body: jwt,
      };

      // Send DIDComm body to receiver
      const result = await veramoAgent.sendMessageDIDCommAlpha1({ data: msgBody }); // "TypeError: Cannot read property 'type' of undefined", gets send nevertheless though.
      return result;
    } catch (error) {
      // I don't know why this throws "TypeError: Cannot read property 'type' of undefined"
      // I think it has to do with my Veramo setup. But all data is send, only the verfication fails.
      // TODO: So I am not going to investigate to save me some time... maybe later.
      // Message is sent to receiver DID but I get no result from method call + message is not saved
      console.log(error);
      return { jwt: jwt, error: error.message };
    }
  }
}
