import { EthrStatusRegistry, EthrCredentialRevoker } from "ethr-status-registry";
import { Status, CredentialStatus } from "credential-status";
import { veramoAgent } from "./VeramoSetup";
import { sign } from "ethjs-signer";
import { IIdentifier, IKey, VerifiableCredential } from "@veramo/core";

// TODO: Think about allowing jwt token instead of hash
export class VeramoRevoker {
  credentialPromise: Promise<VerifiableCredential>;
  status: Status;

  constructor(hash: string) {
    this.status = new Status({
      ...new EthrStatusRegistry({ infuraProjectId: process.env.INFURA_PROJECT_ID }).asStatusMethod,
    });
    this.credentialPromise = veramoAgent.dataStoreGetVerifiableCredential({
      hash: hash,
    });
  }

  async getEthrCredentialStatus(): Promise<CredentialStatus> {
    const credential: VerifiableCredential = await this.credentialPromise;
    const resolvedDid = await veramoAgent.resolveDid({ didUrl: credential.credentialSubject.id });
    const didDoc: any = resolvedDid.didDocument; // needs to be any as DIDDocument type doesn't match between lib and Veramo anymore

    /**
     * Restructure didDoc -> extremly hacky
     * libs expect a set of parameters like publicKey field and
     * type: Secp256k1VerificationKey2018 and ethereumAddress
     */
    didDoc.publicKey = [
      {
        id: `${didDoc.verificationMethod[0].id}#controller`,
        controller: didDoc.verificationMethod[0].id,
        type: "Secp256k1VerificationKey2018",
        ethereumAddress: didDoc.verificationMethod[0].blockchainAccountId.split("@")[0],
      },
    ];

    const isRevoked = await this.status.checkStatus(credential.proof.jwt, didDoc);
    return isRevoked;
  }

  async revokeEthrCredential(): Promise<string> {
    const credential: VerifiableCredential = await this.credentialPromise;
    const identifier: IIdentifier = await veramoAgent.didManagerGet({ did: credential.credentialSubject.id });
    const keys: IKey = await veramoAgent.keyManagerGet({ kid: identifier.controllerKeyId });

    const ethSigner = (rawTx: any, cb: any) => cb(null, sign(rawTx, `0x${keys.privateKeyHex}`));
    const revoker = new EthrCredentialRevoker({ infuraProjectId: process.env.INFURA_PROJECT_ID });
    const txHash = await revoker.revoke(credential.proof.jwt, ethSigner, { gasLimit: 1000000 });
    return txHash;
  }
}
