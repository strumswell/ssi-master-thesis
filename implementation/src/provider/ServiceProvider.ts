export enum DidMethod {
  KEY = "key",
  WEB = "web",
  ION = "ion",
  ETHR = "ethr",
  SOV = "sov",
}

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
   * Get registered DIDs from provider
   */
  getDids(): any;

  /**
   * Create a new DID with a provider
   * @param didMethod Which DID method to use
   */
  createDid(didMethod: DidMethod): any;
}
