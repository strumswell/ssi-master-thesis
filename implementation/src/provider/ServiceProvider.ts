import { VerifiableCredential, W3CCredential } from "@veramo/core";
import {
  VerificationResult,
  Presentation,
  VerifiablePresentation,
  RevocationRequest,
  RevocationResult,
  CredentialIssuanceRequest,
  CredentialStorageResult,
  CredentialDeleteResult,
  PresentationRequest,
} from "./ServiceProviderTypes";

export enum DidMethod {
  KEY = "key",
  WEB = "web",
  ION = "ion",
  ETHR = "ethr:rinkeby",
}

export interface ServiceProvider {
  /**
   * Issue a Verifiable Credential
   * @param credential Credential input from API
   */
  issueVerifiableCredential(credential: CredentialIssuanceRequest, toWallet: boolean): Promise<W3CCredential | Buffer>;

  /**
   * Verify a Verifiable Credential
   * @param credential Credential input from API
   */
  verifyVerifiableCredential(credential: W3CCredential): Promise<VerificationResult>;

  /**
   * Issue a Verifiable Presentation
   * @param credential Credential input from API
   */
  issueVerifiablePresentation(presentation: Presentation): Promise<VerifiablePresentation>;

  /**
   * Verify a Verifiable Presentation
   * @param credential Presentation input from API
   */
  verifyVerifiablePresentation(presentation: VerifiablePresentation): Promise<VerificationResult>;

  /**
   * Revoke a Verifiable Credential
   * @param revocationBody Revocation info from API
   */
  revokeVerifiableCredential(revocationBody: RevocationRequest): Promise<RevocationResult>;

  /**
   * Store a Verifiable Credential
   * @param credential Credential input from API
   */
  storeVerifiableCredential(credential: VerifiableCredential): Promise<CredentialStorageResult>;

  /**
   * Delete a Verifiable Credential
   * @param identifier Credential identifier (hash, uuid, ...) input from API
   */
  deleteVerifiableCredential(identifier: string): Promise<CredentialDeleteResult>;

  // TODO: will probably need a rework. Currently I only cover that somebody requests a credential.
  /**
   * Present a Verifiable Presentation
   * @param presentationRequest Presentation request data from API
   */
  presentVerifiablePresentation(presentationRequest: PresentationRequest): Promise<Buffer>; // For now only Buffer

  /**
   * Derive a credential
   * @param credential Credentual from API input
   */
  deriveVerifiableCredential(credential: W3CCredential): Promise<any>;

  /**
   * Derive a credential
   * @param credential Credentual from API input
   */
  transferVerifiableCredential(credential: W3CCredential): Promise<any>;
}
