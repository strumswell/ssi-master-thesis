import { VerifiableCredential, VerifiablePresentation } from "@veramo/core";
import fetch from "node-fetch";

export class VeramoRemoteAgent {
  private remoteUrl: string;
  private apiKey: string;

  constructor(remoteUrl: string, apiKey: string) {
    this.remoteUrl = remoteUrl;
    this.apiKey = apiKey;
  }

  public async respondToSdr(sdrJwt: string): Promise<string> {
    const sdrData = await this.getMessageData(sdrJwt);
    const vc = await this.getVerifiableCredentialForSdr(sdrData);
    const vp = await this.createVerifiablePresentation(vc);
    const jwt = await this.sendVerifiablePresentation(vp);
    return jwt;
  }

  private async getMessageData(rawJwt: string) {
    const query = {
      where: [
        {
          column: "raw",
          value: [rawJwt],
        },
      ],
    };

    const response = await this.callAgent("dataStoreORMGetMessages", query);
    return response[0].data;
  }

  private async getVerifiableCredentialForSdr(data: unknown) {
    const response = await this.callAgent("getVerifiableCredentialsForSdr", { sdr: data });
    const vc: VerifiableCredential = response[0].credentials[0];
    return vc;
  }

  private async createVerifiablePresentation(credential: VerifiableCredential) {
    const data = {
      presentation: {
        holder: credential.credentialSubject.id,
        issuanceDate: new Date().toISOString(),
        type: ["VerifiablePresentation"],
        verifier: [credential.issuer.id], // For this demo purpose, the issuer is always the verifier
        verifiableCredential: [credential],
      },
      save: false,
      proofFormat: "jwt",
    };
    const response: VerifiablePresentation = await this.callAgent("createVerifiablePresentation", data);
    return response;
  }

  private async sendVerifiablePresentation(presentation: VerifiablePresentation) {
    const data = {
      save: false,
      data: {
        to: presentation.verifier[0],
        from: presentation.holder,
        type: "jwt",
        body: presentation.proof.jwt,
      },
    };

    const response = await this.callAgent("sendMessageDIDCommAlpha1", data);
    return response.raw;
  }

  private async callAgent(method: string, data: unknown) {
    try {
      const response = await fetch(`${this.remoteUrl}/agent/${method}`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.apiKey}` },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.log(error);
    }
  }
}
