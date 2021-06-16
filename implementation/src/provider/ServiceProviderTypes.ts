import { VerifiableCredential, W3CCredential } from "@veramo/core";

////////////////////////////////// GENERAL //////////////////////////////////

/**
 * Different revocation types
 */
export enum CredentialStatusType {
  RevocationList2020Status = "RevocationList2020Status",
  EthrStatusRegistry2019 = "EthrStatusRegistry2019",
}

/**
 * Status of a VC
 */
export enum RevocationStatus {
  PENDING = "pending",
  REVOKED = "revoked",
  NOT_REVOKED = "not revoked",
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

/**
 * General multipurpose response
 */
export interface GenericResult {
  success: boolean;
  error?: string;
}

export function isGenericResult(obj: any): obj is GenericResult {
  return obj.success !== undefined;
}

////////////////////////////////// VC ISSUANCE //////////////////////////////////

/**
 * Credential issuance attributes as defined by vc-http-api.
 */
export interface IssueCredentialRequest {
  /**
   * Credential itself
   */
  credential: W3CCredential;
  /**
   * Options as per VC-HTTP-API spec
   */
  options?: RequestOptions;
}

export function isIssueCredentialRequest(obj: any): obj is IssueCredentialRequest {
  return obj.credential !== undefined;
}

export interface IssueCredentialResponse {
  /**
   * Whether the credential was successfully send to a receiving agent/ wallet
   */
  sent?: boolean;

  /**
   * Credential itself
   */
  credential: W3CCredential;
}

/**
 * Generic Messasge is losly inspired by DIDcomm and its Veramo implementation
 * Used for communication between agents (cloud, local, wallets) e.g. to issue
 * or present a credential.
 * https://identity.foundation/didcomm-messaging/spec/#plaintext-message-structure
 */
export interface GenericMessage {
  id?: string;
  type?: string;
  from?: string;
  to?: [string];
  createdTime?: number;
  expiresTime?: number;
  body?: {
    // Inspired by Veramo as it's not covered by the DIDComm spec
    issuers?: [{ did: string; url: string }];
    credentialContext?: string;
    credentialType?: string;
    claimType?: string;
    claimValues?: {
      [x: string]: any;
    };
    reason?: string;
    [x: string]: any;
  };
}

export function isGenericMessage(obj: any): obj is GenericMessage {
  return obj.credential === undefined;
}

////////////////////////////////// VC Verification //////////////////////////////////

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
