export enum DidMethod {
  KEY = "key",
  WEB = "web",
  ION = "ion",
  ETHR = "ethr",
  SOV = "sov",
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
}
