import { ServiceProvider, DidMethod } from "../ServiceProvider";
import { veramoAgent } from "./VeramoSetup";
import { IIdentifier, VerifiableCredential, W3CCredential } from "@veramo/core";
import { VeramoRevoker } from "./VeramoRevoker";
import { VeramoDatabase } from "./VeramoDatabase";
import {
  Presentation,
  VerifiablePresentation,
  RevocationStatus,
  RevocationResult,
  RevocationRequest,
  CredentialStorageResult,
  CredentialDeleteResult,
  GenericMessage,
  IssueCredentialRequest,
  IssueCredentialResponse,
  GenericResult,
} from "../ServiceProviderTypes";
import { ICredentialRequestInput } from "@veramo/selective-disclosure";

export class VeramoProvider implements ServiceProvider {
  private static instance: VeramoProvider;

  private constructor() {}

  /**
   * Get singleton object
   * @returns Service object
   */
  public static getInstance(): VeramoProvider {
    if (!VeramoProvider.instance) {
      VeramoProvider.instance = new VeramoProvider();
    }
    return VeramoProvider.instance;
  }

  async issueVerifiableCredential(body: IssueCredentialRequest, toWallet: boolean): Promise<IssueCredentialResponse> {
    try {
      body.credential.issuer = { id: body.credential.issuer.toString() };
      const credential: W3CCredential = body.credential;
      const save: boolean = body.options.save ? body.options.save : false;

      const verifiableCredential: W3CCredential = await veramoAgent.createVerifiableCredential({
        save: save,
        credential,
        proofFormat: "jwt",
      });

      // Prepare response
      const result: IssueCredentialResponse = {
        credential: verifiableCredential,
      };

      if (toWallet) {
        // Send VC to another Veramo agent
        try {
          await veramoAgent.sendMessageDIDCommAlpha1({
            save: true,
            data: {
              from: verifiableCredential.issuer.id,
              to: verifiableCredential.credentialSubject.id,
              type: "jwt",
              body: verifiableCredential.proof.jwt,
            },
          });

          result.sent = true;
          return result;
        } catch (error) {
          return error;
        }
      }
      return result;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(vc: W3CCredential): Promise<GenericResult> {
    const result: GenericResult = {
      success: null,
    };
    try {
      const message = await veramoAgent.handleMessage({
        raw: vc.proof.jwt,
      });
      // agent only checks if jwt is valid
      // we still need to manually check the integrity of the vc itself
      result.success = true;
      return result;
    } catch (error) {
      result.success = false;
      result.error = error.message;
      return result;
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

  async verifyVerifiablePresentation(vp: VerifiablePresentation): Promise<GenericResult> {
    const result: GenericResult = {
      success: null,
    };
    try {
      const message = await veramoAgent.handleMessage({
        raw: vp.proof.jwt,
      });
      // agent only checks if jwt is valid
      // we still need to manually check the integrity of the vc itself
      //const valid = await this.areCredentialParamsValid(vc, message);
      result.success = true;
      return result;
    } catch (error) {
      result.success = false;
      result.error = error.message;
      return result;
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

  async createPresentationRequest(request: GenericMessage): Promise<GenericResult> {
    try {
      // Prepare request
      request.body.essential = true;
      request.body.claimValue = JSON.stringify(request.body.claimValues);
      delete request.body.claimValues;

      const jwt: string = await veramoAgent.createSelectiveDisclosureRequest({
        data: {
          tag: request.id ? request.id : new Date().toISOString(),
          issuer: request.from,
          claims: [<ICredentialRequestInput>request.body],
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
      const message = await veramoAgent.sendMessageDIDCommAlpha1({ data: msgBody });
      veramoAgent.emit("sdr", message.raw);

      const result: GenericResult = { success: true };
      return result;
    } catch (error) {
      return error;
    }
  }

  async presentPresentation(request: GenericMessage): Promise<GenericResult> {
    try {
      const vp: VerifiablePresentation = request.body.presentation;

      const msgBody = {
        from: request.from,
        to: request.to[0],
        type: "jwt",
        body: vp.proof.jwt,
      };

      const message = await veramoAgent.sendMessageDIDCommAlpha1({ data: msgBody });
      console.log(message);
      const result: GenericResult = { success: true };
      return result;
    } catch (error) {
      return error;
    }
  }

  async deriveVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Veramo implementation");
    }).catch((error) => {
      return error;
    });
  }

  async transferVerifiableCredential(request: GenericMessage): Promise<GenericResult> {
    try {
      const vc: VerifiableCredential = request.body.credential; // to be transfered VC
      // Prepare a second mandate VC
      const credentialHolder = JSON.parse(JSON.stringify(vc.credentialSubject)); // deep clone
      credentialHolder.id = request.to[0];
      console.log(vc.credentialSubject.id);
      const mandateCredential: W3CCredential = {
        "@context": vc["@context"],
        type: vc.type,
        issuanceDate: new Date().toISOString(),
        expirationDate: new Date(new Date().getTime() + 86400000).toISOString(), // 1 day in future
        issuer: { id: vc.credentialSubject.id },
        credentialSubject: credentialHolder,
      };

      console.log(mandateCredential);

      // Create a second mandate VC
      const mandateVC: VerifiableCredential = await veramoAgent.createVerifiableCredential({
        save: false,
        credential: mandateCredential,
        proofFormat: "jwt",
      });

      // Create a VP containing the original VC + mandate VC from subject
      const vp: VerifiablePresentation = await veramoAgent.createVerifiablePresentation({
        presentation: {
          holder: vc.credentialSubject.id,
          issuanceDate: new Date().toISOString(),
          type: ["VerifiablePresentation"],
          verifier: [request.to[0]],
          verifiableCredential: [vc, mandateVC],
        },
        save: false,
        proofFormat: "jwt",
      });

      // Send VP
      const msgBody = {
        from: request.from,
        to: request.to[0],
        type: "jwt",
        body: vp.proof.jwt,
      };

      await veramoAgent.sendMessageDIDCommAlpha1({ data: msgBody });
      const result: GenericResult = { success: true };
      return result;
    } catch (error) {
      return error;
    }
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
