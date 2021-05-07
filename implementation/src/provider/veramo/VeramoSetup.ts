// Core interfaces
import { createAgent, IDIDManager, IResolver, IDataStore, IKeyManager, IMessageHandler } from "@veramo/core";
// Core identity manager plugin
import { DIDManager } from "@veramo/did-manager";

// Ethr did identity provider
import { EthrDIDProvider } from "@veramo/did-provider-ethr";

// Web did identity provider
import { WebDIDProvider } from "@veramo/did-provider-web";

// Core key manager plugin
import { KeyManager } from "@veramo/key-manager";

// ION did identity provider
import { IonDIDProvider } from "@veramo/did-provider-ion";

// Custom key management system for RN
import { KeyManagementSystem } from "@veramo/kms-local";

// Credential Issuer
import { CredentialIssuer, ICredentialIssuer } from "@veramo/credential-w3c";
import { ISelectiveDisclosure } from "@veramo/selective-disclosure";
import { IDIDComm } from "@veramo/did-comm";

// Custom resolvers
import { DIDResolverPlugin } from "@veramo/did-resolver";
import { Resolver } from "did-resolver";
import { getUniversalResolverFor } from "@veramo/did-resolver/build/universal-resolver";

import { getResolver as ethrDidResolver } from "ethr-did-resolver";
import { getResolver as webDidResolver } from "web-did-resolver";
import { getDidIonResolver } from "@veramo/did-provider-ion";

import { MessageHandler } from "@veramo/message-handler";
import { W3cMessageHandler } from "@veramo/credential-w3c";
import { JwtMessageHandler } from "@veramo/did-jwt";

// Storage plugin using TypeOrm
import { Entities, KeyStore, DIDStore, IDataStoreORM } from "@veramo/data-store";

// TypeORM is installed with daf-typeorm
import { createConnection } from "typeorm";

// Load Environment Vars
import * as dotenv from "dotenv";
dotenv.config();

// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = "database.sqlite";

// You will need to get a project ID from infura https://www.infura.io
const INFURA_PROJECT_ID = process.env.INFURA_PROJECT_ID;

const dbConnection = createConnection({
  type: "sqlite",
  database: DATABASE_FILE,
  synchronize: true,
  logging: ["error", "info", "warn"],
  entities: Entities,
});

export const veramoAgent = createAgent<
  IDIDManager &
    IKeyManager &
    IDataStore &
    IDataStoreORM &
    IResolver &
    ICredentialIssuer &
    IMessageHandler &
    IDIDComm &
    ISelectiveDisclosure
>({
  plugins: [
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: "did:web",
      providers: {
        "did:ethr:rinkeby": new EthrDIDProvider({
          defaultKms: "local",
          network: "rinkeby",
          rpcUrl: "https://rinkeby.infura.io/v3/" + INFURA_PROJECT_ID,
        }),
        "did:web": new WebDIDProvider({
          defaultKms: "local",
        }),
        "did:ion": new IonDIDProvider({
          defaultKms: "local",
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ethr: ethrDidResolver({
          networks: [
            {
              name: "rinkeby",
              rpcUrl: "https://rinkeby.infura.io/v3/" + INFURA_PROJECT_ID,
            },
          ],
        }).ethr,
        web: webDidResolver().web,
        ion: getDidIonResolver().ion,
        ...getUniversalResolverFor(["key", "io", "elem", "sov"]),
      }),
    }),
    new CredentialIssuer(),
    new MessageHandler({
      messageHandlers: [new JwtMessageHandler(), new W3cMessageHandler()],
    }),
  ],
});
