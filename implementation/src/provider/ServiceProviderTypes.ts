import { W3CCredential } from "@veramo/core";

export enum CredentialStatusType {
  RevocationList2020Status = "CredentialStatusType",
  EthrStatusRegistry2019 = "EthrStatusRegistry2019",
}

export interface CredentialIssuanceRequest {
  /**
   * Credential itself
   */
  credential: W3CCredential;
  /**
   * Options as per VC-HTTP-API spec
   */
  options: {
    verificationMethod: string;
    proofPurpose: string;
    created: string;
    domain: string;
    challenge: string;
    credentialStatus: {
      type: CredentialStatusType;
    };
  };
}

export interface CredentialVerificationResult {
  /**
   * Whether the verification was successful
   */
  verified: boolean;

  /**
   * Possible error message if verification was not successful
   */
  error?: string;
}
