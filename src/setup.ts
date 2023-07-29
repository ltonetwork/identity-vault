// Core interfaces
import {
  createAgent,
  IDIDManager,
  IResolver,
  IDataStore,
  IKeyManager,
  ICredentialPlugin,
  ICredentialStatusManager,
  ICredentialStatusVerifier
} from '@veramo/core';

// Core identity manager plugin
import { DIDManager } from '@veramo/did-manager';

// LTO DID identity provider
import { LtoCredentialPlugin, LtoCredentialStatusVerifier, LtoDIDProvider } from '@ltonetwork/veramo-plugin';

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
  VeramoEd25519Signature2018,
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
import { DataSource, DataSourceOptions } from 'typeorm';

import { base58ToBytes, bytesToBase58 } from '@veramo/utils';

import { sha256 } from '@noble/hashes/sha256';

export const SEED = process.env.LTO_WALLET_SEED_BASE58
  ? new TextDecoder().decode(base58ToBytes(process.env.LTO_WALLET_SEED_BASE58))
  : process.env.LTO_WALLET_SEED;

const KMS_SECRET_KEY = process.env.KMS_SECRET_KEY || (SEED ? bytesToBase58(sha256(SEED)) : 'not_secret');

const INDEX_URL = process.env.INDEX_URL ||
  (
    process.env.NODE_URL ? process.env.NODE_URL + '/index' :
    process.env.LTO_NETWORK === 'MAINNET' ? 'https://nodes.lto.network/index' : 'https://testnet.lto.network/index'
  );

let dbParams;

if (process.env.VAULT_DB_DSN) {
  const [type, paramString] = process.env.VAULT_DB_DSN.split(':', 2);
  dbParams = {
    ...(Object.fromEntries(paramString.split(';').map((p) => p.split('=', 2) as [string, string]))),
    type,
  }
} else {
  dbParams = {
    type: 'sqlite',
    database: 'database.sqlite',
  };
}

const dbConnection = new DataSource({
  synchronize: false,
  ...dbParams,
  migrations,
  migrationsRun: true,
  logging: ['error', 'info', 'warn'],
  entities: Entities,
} as DataSourceOptions).initialize();

export const agent = createAgent<
  IDIDManager &
  IKeyManager &
  IDataStore &
  IDataStoreORM &
  IResolver &
  ICredentialPlugin &
  ICredentialIssuerLD &
  ICredentialStatusManager &
  ICredentialStatusVerifier
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
    new DIDResolverPlugin(getUniversalResolverFor(['lto'], INDEX_URL + '/identifiers/')),
    new LtoCredentialPlugin(
      new CredentialPlugin() as any,
      {
        networkId: process.env.LTO_NETWORK === 'MAINNET' ? 'L' : 'T',
        nodeAddress: process.env.NODE_URL,
        sponsor: SEED ? { seed: SEED } : undefined,
        addCredentialStatus: true,
      }
    ),
    new LtoCredentialStatusVerifier({ url: INDEX_URL + '/credential-status/' } ),
    new CredentialIssuerLD({
      contextMaps: [
        LdDefaultContexts,
        credential_contexts as any,
      ],
      suites: [new VeramoEcdsaSecp256k1RecoverySignature2020(), new VeramoEd25519Signature2018()],
    }),
  ],
});
