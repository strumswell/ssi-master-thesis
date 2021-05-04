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
