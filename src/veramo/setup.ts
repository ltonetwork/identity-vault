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

// Custom resolvers
import { DIDResolverPlugin, getUniversalResolver } from '@veramo/did-resolver';

// Storage plugin using TypeOrm
import { Entities, KeyStore, DIDStore, IDataStoreORM, PrivateKeyStore, migrations } from '@veramo/data-store';

// TypeORM is installed with `@veramo/data-store`
import { DataSource } from 'typeorm';

// This will be the name for the local sqlite database for demo purposes
const DATABASE_FILE = 'database.sqlite';

// This will be the secret key for the KMS
const KMS_SECRET_KEY = '11b574d316903ced6cc3f4787bbcc3047d9c72d1da4d83e36fe714ef785d10c1';

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
  IDIDManager & IKeyManager & IDataStore & IDataStoreORM & IResolver & ICredentialPlugin
>({
  plugins: [
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
          networkId: 'T',
          nodeAddress: 'http://localhost:6869',
          sponsor: {
            seed: 'cruise unaware deputy shiver tunnel rule illegal message tuna dog decorate entire pony skate crouch',
          },
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: getUniversalResolver('https://localhost:8080/identifiers/'),
    }),
    new CredentialPlugin(),
  ],
});
