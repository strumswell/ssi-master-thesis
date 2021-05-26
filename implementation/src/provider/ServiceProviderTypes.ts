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
 * Additional options for requests used by vc-http-api.
 * Mostly used optionally.
 */
interface RequestOptions {
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
 * Credential issuance attributes as defined by vc-http-api.
 */
export interface CredentialIssuanceRequest {
  /**
   * Credential itself
   */
  credential: W3CCredential;
  /**
   * Options as per VC-HTTP-API spec
   */
  options: RequestOptions;
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
