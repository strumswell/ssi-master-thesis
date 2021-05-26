import { W3CCredential } from "@veramo/core";
import {
  VerificationResult,
  Presentation,
  VerifiablePresentation,
  RevocationRequest,
  RevocationResult,
} from "./ServiceProviderTypes";

export enum DidMethod {
  KEY = "key",
  WEB = "web",
  ION = "ion",
  ETHR = "ethr:rinkeby",
}

// TODO: Add missing routes from OpenAPI spec + add types
export interface ServiceProvider {
  /**
   * Issue a Verifiable Credential
   * @param credential Credential input from API
   */
  issueVerifiableCredential(credential: any): Promise<W3CCredential>;

  /**
   * Verify a Verifiable Credential
   * @param credential Credential input from API
   */
  verifyVerifiableCredential(credential: any): Promise<VerificationResult>;

  /**
   * Issue a Verifiable Presentation
   * @param credential Credential input from API
   */
  issueVerifiablePresentation(presentation: Presentation): Promise<VerifiablePresentation>;

  /**
   * Verify a Verifiable Presentation
   * @param credential Presentation input from API
   */
  verifyVerifiablePresentation(presentation: any): any;

  /**
   * Revoke a Verifiable Credential
   * @param revocationBody Revocation info from API
   */
  revokeVerifiableCredential(revocationBody: RevocationRequest): Promise<RevocationResult>;

  /**
   * Store a Verifiable Credential
   * @param credential Credential input from API
   */
  storeVerifiableCredential(credential: any): any;

  /**
   * Delete a Verifiable Credential
   * @param identifier Credential identifier input from API
   */
  deleteVerifiableCredential(identifier: any): any;
}
