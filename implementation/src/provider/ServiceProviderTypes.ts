import { VerifiableCredential, W3CCredential } from "@veramo/core";

export enum CredentialStatusType {
  RevocationList2020Status = "RevocationList2020Status",
  EthrStatusRegistry2019 = "EthrStatusRegistry2019",
}

export enum RevocationStatus {
  PENDING = "pending",
  REVOKED = "revoked",
  NOT_REVOKED = "not revoked",
}

/**
 * Supported credentials that can be issued to a wallet application
 */
export enum SupportedWalletCredential {
  MastersDegree = "MastersDegree",
}

/**
 * Additional options for requests used by vc-http-api.
 * Mostly used optionally.
 */
interface RequestOptions {
  save?: boolean;
  verificationMethod: string;
  proofPurpose: string;
  created: string;
  domain: string;
  challenge: string;
  credentialStatus: {
    type: CredentialStatusType;
  };
}

export interface TrinsicMastersDegreeProperties {
  fullName: string;
  title: string;
  nickname: string;
}

/**
 * Credential issuance attributes as defined by vc-http-api.
 */
export interface CredentialIssuanceRequest {
  /**
   * Credential itself
   */
  credential?: W3CCredential;
  /**
   * Options as per VC-HTTP-API spec
   */
  options?: RequestOptions;

  /**
   * Alternative body for issuing a predefined VC to a wallet
   * WalletIssuanceRequest
   */
  credentialType?: SupportedWalletCredential;
  credentialProperties?: TrinsicMastersDegreeProperties;
}

/**
 * Credential verification result attributes as defined by vc-http-api.
 */
export interface VerificationResult {
  /**
   * Whether the verification was successful
   */
  verified: boolean;

  /**
   * Possible error message if verification was not successful
   */
  error?: string;
}

/**
 * A non-verifiable presentation
 *
 * Difference to @veramo/W3CPresentation is
 * the now optional verifier attribute as defined by
 * Verifiable Credential Data Model 1.0
 */
export interface Presentation {
  id?: string;
  holder: string;
  issuanceDate?: string;
  expirationDate?: string;
  "@context": string[];
  type: string[];
  verifier?: string[];
  verifiableCredential: VerifiableCredential[];
  [x: string]: any;
}

/**
 * A verifiable presentation
 *
 * Difference to @veramo/VerifiablePresentation is
 * the now optional verifier attribute as defined by
 * Verifiable Credential Data Model 1.0
 */
export interface VerifiablePresentation {
  id?: string;
  holder: string;
  issuanceDate?: string;
  expirationDate?: string;
  "@context": string[];
  type: string[];
  verifier?: string[];
  verifiableCredential: VerifiableCredential[];
  proof: {
    type?: string;
    [x: string]: any;
  };
  [x: string]: any;
}

/**
 * Presentation issuance attributes as defined by vc-http-api.
 */
export interface PresentationIssuanceRequest {
  presentation: Presentation;
  options?: RequestOptions;
}

export interface RevocationRequest {
  credentialId: string;
  credentialStatus: [
    {
      type: CredentialStatusType;
      status?: string;
    }
  ];
}

export interface RevocationResult {
  status: RevocationStatus;
  message?: string;
}

/**
 * Result after storing a credential.
 */
export interface CredentialStorageResult {
  /**
   * Id is used to adress a credential at storage level.
   * Could be a hash (see Veramo) or a uuid (see MATTR).
   */
  id: string;
  message?: string;
}

/**
 * Result after deleting a credential.
 */
export interface CredentialDeleteResult {
  isDeleted: boolean;
  message?: string;
}

// TODO: Probably needs a revamp as the flow will probably change with future Veramo solution. This only covers the request via QR-code approach from MATTR & Trinsic
export interface PresentationRequest {
  /**
   * JSON-LD formatted presentation. Only applicable with providers
   * not using pre-defined credential types including it's schema.
   */
  presentation?: VerifiablePresentation;

  /**
   * Applicable with providers like Trinsic or MATTR where presentable
   * credentials and their schema have to be pre-defined on their platform.
   */
  credentialType?: SupportedWalletCredential;
}

/**
 * DIDComm Messsage Body
 * Inspired by https://identity.foundation/didcomm-messaging/spec/#plaintext-message-structure
 */
export interface DIDCommMessage {
  id?: string;
  type?: string;
  from: string;
  to: [string];
  created_time?: number;
  expires_time?: number;
  body: {
    // Inspired by Veramo as it's not covered by the DIDComm spec
    issuers: [{ did: string; url: string }];
    credentialContext?: string;
    credentialType?: string;
    claimType: string;
    claimValue?: string;
    reason: string;
    [x: string]: any;
  };
}
