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
  issueVerifiableCredential(credential: any): any;

  /**
   * Verify a Verifiable Credential
   * @param credential Credential input from API
   */
  verifyVerifiableCredential(credential: any): any;

  /**
   * Issue a Verifiable Presentation
   * @param credential Credential input from API
   */
  issueVerifiablePresentation(presentation: any): any;

  /**
   * Verify a Verifiable Presentation
   * @param credential Presentation input from API
   */
  verifyVerifiablePresentation(presentation: any): any;

  /**
   * Revoke a Verifiable Credential
   * @param revocationBody Revocation info from API
   */
  revokeVerifiableCredential(revocationBody: any): any;

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
