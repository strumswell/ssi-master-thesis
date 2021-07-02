import { ClientSecretCredential } from "@azure/identity";
import { VerifiableCredential, VerifiablePresentation, W3CCredential } from "@veramo/core";
import {
  CryptoBuilder,
  KeyReference,
  RequestorBuilder,
  IRequestor,
} from "verifiablecredentials-verification-sdk-typescript";
import { ServiceProvider } from "../ServiceProvider";
import {
  CredentialDeleteResult,
  CredentialStorageResult,
  GenericMessage,
  GenericResult,
  Presentation,
  RevocationRequest,
  RevocationResult,
} from "../ServiceProviderTypes";
import { v4 as uuidv4 } from "uuid";
import * as qr from "qr-image";

export class AzureProvider implements ServiceProvider {
  private static instance: AzureProvider;
  public issuanceRequests: Map<string, any> = new Map<string, any>();
  private crypto;

  private constructor() {
    const kvCredentials = new ClientSecretCredential(
      process.env.AZURE_TENANT_ID,
      process.env.AZURE_CLIENT_ID,
      process.env.AZURE_CLIENT_SECRET
    );
    const signingKeyReference = new KeyReference(
      process.env.AZURE_KV_KEY_ID,
      "key",
      process.env.AZURE_KV_REMOTE_KEY_ID
    );

    this.crypto = new CryptoBuilder()
      .useSigningKeyReference(signingKeyReference)
      .useKeyVault(kvCredentials, process.env.AZURE_KV_URI)
      .useDid(process.env.AZURE_DID)
      .build();
  }

  /**
   * Get singleton object
   * @returns Service object
   */
  public static getInstance(): AzureProvider {
    if (!AzureProvider.instance) {
      AzureProvider.instance = new AzureProvider();
    }
    return AzureProvider.instance;
  }

  async issueVerifiableCredential(body: GenericMessage, toWallet: boolean): Promise<Buffer> {
    try {
      if (!toWallet) throw new Error("Only issuance to Microsoft Authenticator (wallet) is supported");
      if (!(body.from && body.body.request.credentialType)) throw new Error("Please define from and credentialType");

      // This is a mess. I hate my life (and this azure sdk).
      const requestBuilder = new RequestorBuilder(
        {
          clientName: undefined,
          clientId: undefined,
          redirectUri: undefined,
          logoUri: undefined,
          tosUri: undefined,
          clientPurpose: undefined,
          presentationDefinition: {
            input_descriptors: [
              {
                id: "credential",
                schema: {
                  uri: [body.body.request.credentialType],
                },
                issuance: [
                  {
                    manifest: body.from,
                  },
                ],
              },
            ],
          },
        } as IRequestor,
        this.crypto
      ).allowIssuance();

      const issuanceRequest = await requestBuilder.build().create(); // Create a issuance request
      const sessionId = uuidv4();
      this.issuanceRequests.set(sessionId, issuanceRequest.request); // cache issuance request

      // Encode issuance request url (local) into qr code
      // MSFT Authenticator uses encoded URL to get request from local api @ /issue-request.jwt route
      const requestUri = encodeURIComponent(`${process.env.LOCAL_DEV_URL}/issue-request.jwt?id=${sessionId}`);
      const issueRequestReference = "openid://vc/?request_uri=" + requestUri;
      const qrcode: Buffer = qr.imageSync(issueRequestReference, { type: "png" });
      return qrcode;
    } catch (error) {
      return error;
    }
  }

  async verifyVerifiableCredential(vc: W3CCredential): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async issueVerifiablePresentation(body: Presentation): Promise<VerifiablePresentation> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async verifyVerifiablePresentation(vp: VerifiablePresentation): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async revokeVerifiableCredential(revocationBody: RevocationRequest): Promise<RevocationResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async storeVerifiableCredential(verifiableCredential: VerifiableCredential): Promise<CredentialStorageResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async deleteVerifiableCredential(identifier: string): Promise<CredentialDeleteResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async createPresentationRequest(request: GenericMessage): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async presentPresentation(request: GenericMessage): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async deriveVerifiableCredential(credential: W3CCredential): Promise<any> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }

  async transferVerifiableCredential(request: GenericMessage): Promise<GenericResult> {
    return new Promise<any>(() => {
      throw new Error("No Azure AD for VCs implementation");
    }).catch((error) => {
      return error;
    });
  }
}
