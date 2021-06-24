import {
  CredentialsServiceClient,
  Credentials,
  ProviderServiceClient,
  ProviderCredentials,
} from "@trinsic/service-clients";
import { ServiceProvider } from "../ServiceProvider";
import * as qr from "qr-image";
import { VerifiableCredential, W3CCredential } from "@veramo/core";
import {
  CredentialDeleteResult,
  CredentialStorageResult,
  GenericMessage,
  GenericResult,
  isGenericMessage,
  IssueCredentialRequest,
  IssueCredentialResponse,
  Presentation,
  RevocationRequest,
  RevocationResult,
  VerifiablePresentation,
} from "../ServiceProviderTypes";
import { CreateCredentialResponse } from "@trinsic/service-clients/dist/credentials/models";
import { QrCache } from "../../util/QrCache";

export class TrinsicProvider implements ServiceProvider {
  private static instance: TrinsicProvider;
  client: CredentialsServiceClient;
  provider: ProviderServiceClient;

  private constructor() {
    // Credentials API
    this.client = new CredentialsServiceClient(new Credentials(process.env.TRINSIC_KEY), {
      noRetryPolicy: true,
    });
    this.provider = new ProviderServiceClient(new ProviderCredentials(process.env.TRINSIC_KEY), {
      noRetryPolicy: true,
    });
  }

  /**
   * Get singleton object
   * @returns Service object
   */
  public static getInstance(): TrinsicProvider {
    if (!TrinsicProvider.instance) {
      TrinsicProvider.instance = new TrinsicProvider();
    }
    return TrinsicProvider.instance;
  }

  // TODO: think about changing response schema to also include credential id (used for delete e.g.)
  async issueVerifiableCredential(
    body: IssueCredentialRequest | GenericMessage,
    toWallet: boolean
  ): Promise<IssueCredentialResponse | Buffer> {
    try {
      console.log(toWallet);
      if (!toWallet) throw Error("Only issuance to Trinsic wallet is supported");

      if (isGenericMessage(body)) {
        const message: GenericMessage = body;
        // Issue Masters's Degree VC offer
        const request = {
          definitionId: message.body.credentialType,
          connectionId: null,
          automaticIssuance: false,
          credentialValues: message.body.claimValues,
        };
        const vcOffer: CreateCredentialResponse = await this.client.createCredential(request);
        const qrcode: Buffer = qr.imageSync(vcOffer.offerUrl, { type: "png" });
        return qrcode;
      } else {
        throw Error("Issuing manual VCs is not supported. Please define a GenericMessage.");
      }
    } catch (error) {
      return error;
    }
  }

  public async verifyVerifiableCredential(credential: W3CCredential): Promise<GenericResult> {
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

  public async verifyVerifiablePresentation(presentation: VerifiablePresentation): Promise<GenericResult> {
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
    await this.client.deleteCredential(identifier);
    const result: CredentialDeleteResult = {
      isDeleted: true,
      message: "Deleted from Trinsic backend, but credential will still be available on user wallet!",
    };
    return result;
  }

  async createPresentationRequest(request: GenericMessage): Promise<Buffer> {
    try {
      const verification = await this.client.createVerificationFromPolicy(request.body.credentialType);
      const qrcode: Buffer = qr.imageSync(verification.verificationRequestUrl, { type: "png" });
      return qrcode;
    } catch (error) {
      return error;
    }
  }
  // TODO: check implementation
  async presentPresentation(request: GenericMessage): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No implementation yet");
    }).catch((error) => {
      return error;
    });
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
}
