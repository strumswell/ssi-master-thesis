import { CredentialsServiceClient, Credentials } from "@trinsic/service-clients";
import { ServiceProvider } from "../ServiceProvider";
import * as qr from "qr-image";
import { VerifiableCredential, W3CCredential } from "@veramo/core";
import {
  CredentialDeleteResult,
  CredentialIssuanceRequest,
  CredentialStorageResult,
  Presentation,
  PresentationRequest,
  RevocationRequest,
  RevocationResult,
  SupportedWalletCredential,
  TrinsicMastersDegreeProperties,
  VerifiablePresentation,
  VerificationResult,
} from "../ServiceProviderTypes";
import { CreateCredentialResponse } from "@trinsic/service-clients/dist/credentials/models";

export class TrinsicProvider implements ServiceProvider {
  client: CredentialsServiceClient;
  constructor() {
    // Credentials API
    this.client = new CredentialsServiceClient(new Credentials(process.env.TRINSIC_KEY), {
      noRetryPolicy: true,
    });
  }

  public async issueVerifiableCredential(credential: CredentialIssuanceRequest, toWallet: boolean): Promise<Buffer> {
    try {
      console.log(toWallet);
      if (!toWallet) throw Error("Only issuance to Trinsic wallet is supported");
      if (credential.credentialType === "MastersDegree") {
        // Issue Masters's Degree VC offer
        const input: TrinsicMastersDegreeProperties = credential.credentialProperties;
        const request = {
          definitionId: process.env.TRINSIC_MDEGREE_DEF,
          connectionId: null,
          automaticIssuance: false,
          credentialValues: {
            "Full Name": input.fullName,
            Title: input.title,
            Nickname: input.nickname,
          },
        };
        const vcOffer: CreateCredentialResponse = await this.client.createCredential(request);
        const qrcode: Buffer = qr.imageSync(vcOffer.offerUrl, { type: "png" });
        return qrcode;
      } else {
        throw new Error("Credential type not supported.");
      }
    } catch (error) {
      return error;
    }
  }

  public async verifyVerifiableCredential(credential: W3CCredential): Promise<VerificationResult> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async issueVerifiablePresentation(presentation: Presentation): Promise<VerifiablePresentation> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async verifyVerifiablePresentation(presentation: VerifiablePresentation): Promise<VerificationResult> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async revokeVerifiableCredential(revocationBody: RevocationRequest): Promise<RevocationResult> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async storeVerifiableCredential(credential: VerifiableCredential): Promise<CredentialStorageResult> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async deleteVerifiableCredential(identifier: string): Promise<CredentialDeleteResult> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  // TODO: Handle different credential types. Currently only Master's Degree
  public async presentVerifiablePresentation(presentationRequest: PresentationRequest): Promise<any> {
    try {
      if (presentationRequest.presentation)
        throw Error("Presenting raw verifiable presentations is not supported with Trinsic.");
      if (presentationRequest.credentialType !== SupportedWalletCredential.MastersDegree)
        throw Error("Unsupported credential type");

      const verification = await this.client.createVerificationFromPolicy(process.env.TRINSIC_MDEGREE_VERID);
      const qrcode: Buffer = qr.imageSync(verification.verificationRequestUrl, { type: "png" });
      return qrcode;
    } catch (error) {
      return error;
    }
  }

  public async deriveVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  public async transferVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Trinsic implementation");
    }).catch((error) => {
      return error;
    });
  }

  // Get connection invite from organization for user wallet
  private async getInvite() {
    try {
      return await this.client.createConnection({});
    } catch (e) {
      console.log(e.message || e.toString());
    }
  }
}
