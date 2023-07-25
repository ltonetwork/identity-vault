// Core interfaces
import { createAgent, IDIDManager, IResolver, IDataStore, IKeyManager, ICredentialPlugin } from '@veramo/core';

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager';

// LTO DID identity provider
import { LtoDIDProvider } from '@ltonetwork/veramo-plugin';

// Core key manager plugin
import { KeyManager } from '@veramo/key-manager';

// Custom key management system for RN
import { KeyManagementSystem, SecretBox } from '@veramo/kms-local';

// W3C Verifiable Credential plugin
import { CredentialPlugin } from '@veramo/credential-w3c';
import {
  CredentialIssuerLD,
  ICredentialIssuerLD,
  LdDefaultContexts,
  VeramoEcdsaSecp256k1RecoverySignature2020,
  VeramoEd25519Signature2020,
} from '@veramo/credential-ld';

import { contexts as credential_contexts } from '@transmute/credentials-context'

// Custom resolvers
import { DIDResolverPlugin, getUniversalResolverFor } from '@veramo/did-resolver';

// Storage plugin using TypeOrm
import {
  Entities,
  KeyStore,
  DIDStore,
  IDataStoreORM,
  PrivateKeyStore,
  migrations,
  DataStore,
  DataStoreORM
} from '@veramo/data-store';

// TypeORM is installed with `@veramo/data-store`
import { DataSource } from 'typeorm';
import { base58ToBytes } from '@veramo/utils';

// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database.sqlite';

// This will be the secret key for the KMS
const KMS_SECRET_KEY = '11b574d316903ced6cc3f4787bbcc3047d9c72d1da4d83e36fe714ef785d10c1';

export const SEED = process.env.LTO_WALLET_SEED_BASE58
    ? new TextDecoder().decode(base58ToBytes(process.env.LTO_WALLET_SEED_BASE58))
    : process.env.LTO_WALLET_SEED;

const dbConnection = new DataSource({
  type: 'sqlite',
  database: DATABASE_FILE,
  synchronize: false,
  migrations,
  migrationsRun: true,
  logging: ['error', 'info', 'warn'],
  entities: Entities,
}).initialize();

export const agent = createAgent<
    IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin & ICredentialIssuerLD
>({
  plugins: [
    new DataStore(dbConnection),
    new DataStoreORM(dbConnection),
    new KeyManager({
      store: new KeyStore(dbConnection),
      kms: {
        local: new KeyManagementSystem(new PrivateKeyStore(dbConnection, new SecretBox(KMS_SECRET_KEY))),
      },
    }),
    new DIDManager({
      store: new DIDStore(dbConnection),
      defaultProvider: 'did:lto',
      providers: {
        'did:lto': new LtoDIDProvider({
          defaultKms: 'local',
          networkId: process.env.LTO_NETWORK === 'MAINNET' ? 'L' : 'T',
          nodeAddress: process.env.NODE_URL,
          sponsor: SEED ? { seed: SEED } : undefined,
        }),
      },
    }),
    new DIDResolverPlugin(getUniversalResolverFor(['lto'], 'https://testnet.lto.network/index/identifiers/')),
    new CredentialPlugin(),
    new CredentialIssuerLD({
      contextMaps: [
        LdDefaultContexts,
        credential_contexts as any,
      ],
      suites: [new VeramoEcdsaSecp256k1RecoverySignature2020(), new VeramoEd25519Signature2020()],
    }),
  ],
});
