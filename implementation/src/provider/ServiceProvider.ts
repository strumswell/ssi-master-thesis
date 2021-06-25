import { VerifiableCredential, W3CCredential } from "@veramo/core";
import {
  Presentation,
  VerifiablePresentation,
  RevocationRequest,
  RevocationResult,
  CredentialStorageResult,
  CredentialDeleteResult,
  GenericMessage,
  GenericResult,
  IssueCredentialRequest,
  IssueCredentialResponse,
} from "./ServiceProviderTypes";

export enum DidMethod {
  KEY = "key",
  WEB = "web",
  ION = "ion",
  ETHR = "ethr:rinkeby",
}

export interface ServiceProvider {
  // I S S U E R
  /**
   * Issue a Verifiable Credential
   * @param credential Credential input from API
   */
  issueVerifiableCredential(
    body: IssueCredentialRequest | GenericMessage,
    toWallet: boolean
  ): Promise<IssueCredentialResponse | Buffer>;

  /**
   * Revoke a Verifiable Credential
   * @param revocationBody Revocation info from API
   */
  revokeVerifiableCredential(revocationBody: RevocationRequest): Promise<RevocationResult>;

  // V E R I F I E R
  /**
   * Verify a Verifiable Credential
   * @param credential Credential input from API
   */
  verifyVerifiableCredential(credential: W3CCredential): Promise<GenericResult>;

  /**
   * Verify a Verifiable Presentation
   * @param credential Presentation input from API
   */
  verifyVerifiablePresentation(presentation: VerifiablePresentation): Promise<GenericResult>;

  /**
   * Create a presentation request via QR code or direct message to agent
   * @param request Generic message for communication with agent handling the request
   */
  createPresentationRequest(request: GenericMessage): Promise<Buffer | GenericResult>; // For now only Buffer

  // H O L D E R
  /**
   * Derive a credential
   * @param credential Credentual from API input
   */
  deriveVerifiableCredential(credential: W3CCredential): Promise<any>;

  /**
   * Store a Verifiable Credential
   * @param credential Credential input from API
   */
  storeVerifiableCredential(credential: VerifiableCredential): Promise<CredentialStorageResult>;

  /**
   * Derive a credential
   * @param credential Credentual from API input
   */
  transferVerifiableCredential(credential: GenericMessage): Promise<any>;

  /**
   * Delete a Verifiable Credential
   * @param identifier Credential identifier (hash, uuid, ...) input from API
   */
  deleteVerifiableCredential(identifier: string): Promise<CredentialDeleteResult>;

  /**
   * Issue a Verifiable Presentation
   * @param credential Credential input from API
   */
  issueVerifiablePresentation(presentation: Presentation): Promise<VerifiablePresentation>;

  /**
   * Present a credential to a verifier agent
   * @param request Generic message containing the presentation info
   */
  presentPresentation(request: GenericMessage): Promise<GenericResult>;
}
