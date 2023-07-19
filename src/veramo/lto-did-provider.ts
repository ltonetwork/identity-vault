import { AbstractIdentifierProvider } from '@veramo/did-manager';
import { DIDDocument, IAgentContext, IIdentifier, IKey, IKeyManager, IService } from '@veramo/core';
import LTO, { Binary, Account, IdentityBuilder, Transaction } from '@ltonetwork/lto';
import { IAccountIn, TDIDRelationship } from '@ltonetwork/lto/interfaces';

interface LtoOptions {
  defaultKms: string;
  sponsor?: Account | IAccountIn;
  lto?: LTO;
  networkId?: string;
  nodeAddress?: string;
  nodeApiKey?: string;
}

interface CreateIdentifierOptions {
  verificationMethods?: VerificationMethod[];
  services?: IService[];
}

interface RelationshipOptions {
  authentication?: boolean;
  assertionMethod?: boolean;
  keyAgreement?: boolean;
  capabilityInvocation?: boolean;
  capabilityDelegation?: boolean;
}
const ALL_RELATIONSHIPS = [
  'authentication',
  'assertionMethod',
  'keyAgreement',
  'capabilityInvocation',
  'capabilityDelegation'
];

interface VerificationMethod extends IAccountIn, RelationshipOptions {
  expires?: Date;
}

export class LtoDIDProvider extends AbstractIdentifierProvider {
  private readonly defaultKms: string
  private readonly lto: LTO;
  private readonly sponsor?: Account;

  constructor(options: LtoOptions) {
    super();

    this.defaultKms = options.defaultKms;

    this.lto = options.lto ?? new LTO(options.networkId ?? 'L');
    if (options.lto && options.networkId && options.lto.networkId !== options.networkId) {
      throw new Error(`Network id mismatch: ${options.lto.networkId} !== ${options.networkId}`);
    }

    if (options.sponsor) {
      this.sponsor = options.sponsor instanceof Account ? options.sponsor : this.lto.account(options.sponsor);
    }
  }

  private async broadcast(...tsx: Transaction[]): Promise<Transaction[]> {
    return Promise.all(
      tsx
        .map((tx) => this.sponsor ? tx.sponsorWith(this.sponsor) : tx)
        .map((tx) => this.lto.node.broadcast(tx)),
    );
  }

  private ltoAccount({ meta, type, privateKeyHex, publicKeyHex }: IKey): Account {
    return this.lto.account({
      ...meta,
      keyType: type.toLowerCase(),
      privateKey: privateKeyHex ? Binary.fromHex(privateKeyHex) : undefined,
      publicKey: Binary.fromHex(publicKeyHex)
    });
  }

  private getManagementKey(identifier: IIdentifier): IKey & { privateKeyHex: string } {
    const controllerKeyId = identifier.controllerKeyId ?? `${identifier.did}#sign`;
    const managementKey = identifier.keys.find((key) => key.kid === controllerKeyId);

    if (!managementKey) throw new Error(`No management key found for ${identifier.did}`);
    if (!managementKey.privateKeyHex) throw new Error(`Private key not known for ${identifier.did}`);

    return managementKey as IKey & { privateKeyHex: string };
  }

  private getRelationships(options: RelationshipOptions): TDIDRelationship[] {
    return Object.entries(options)
      .filter(([key, value]) => ALL_RELATIONSHIPS.includes(key) && !!value)
      .map(([key]) => key as TDIDRelationship);
  }

  private async createKey(
    context: IAgentContext<IKeyManager>,
    { kms }: { kms?: string; },
    account: Account,
  ): Promise<IKey> {
    if (!account.signKey.privateKey) throw new Error('Account does not have a private key');

    const keyType =
      (account.keyType.charAt(0).toUpperCase() + account.keyType.slice(1)) as 'Ed25519' | 'Secp256k1' | 'Secp256r1';

    return await context.agent.keyManagerImport({
      kid: `${account.did}#sign`,
      kms: kms || this.defaultKms,
      privateKeyHex: account?.signKey.privateKey!.hex,
      publicKeyHex: account?.signKey.publicKey.hex,
      type: keyType,
      meta: {
        address: account.address,
        seed: account.seed,
        nonce: typeof account.nonce === 'number' ? account.nonce : account.nonce?.hex,
      }
    });
  }

  private async createEncryptKey(
    context: IAgentContext<IKeyManager>,
    { kms }: { kms?: string; },
    account: Account,
  ): Promise<IKey> {
    if (!account.encryptKey.privateKey) throw new Error('Account does not have a private encryption key');
    if (account.keyType !== 'ed25519') throw new Error('Encryption key needs to be created for ed25519 key');

    return await context.agent.keyManagerImport({
      kid: `${account.did}#encrypt`,
      kms: kms || this.defaultKms,
      privateKeyHex: account?.encryptKey.privateKey!.hex,
      publicKeyHex: account?.encryptKey.publicKey.hex,
      type: 'X25519',
      meta: {
        address: account.address,
        seed: account.seed,
        nonce: typeof account.nonce === 'number' ? account.nonce : account.nonce?.hex,
      }
    });
  }

  private async registerDID(
    options: IAccountIn & RelationshipOptions & CreateIdentifierOptions
  ): Promise<IdentityBuilder> {
    const account = this.lto.account(options);
    const builder = new IdentityBuilder(account);

    const relationships = this.getRelationships(options);
    if (relationships.length !== ALL_RELATIONSHIPS.length) {
      builder.addVerificationMethod(account, relationships);
    }

    for (const method of options.verificationMethods ?? []) {
      builder.addVerificationMethod(this.lto.account(method), this.getRelationships(method), method.expires);
    }

    for (const service of options.services ?? []) {
      builder.addService(service);
    }

    await this.broadcast(...builder.transactions);

    return builder;
  }

  async createIdentifier(
    args: {
      kms?: string;
      options?: IAccountIn & RelationshipOptions & CreateIdentifierOptions;
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<Omit<IIdentifier, 'provider'>> {
    const builder = await this.registerDID(args.options ?? {});
    const accounts = [builder.account, ...builder.newMethods.map((method) => method.account)];

    const promises = [];
    for (const account of accounts) {
      promises.push(this.createKey(context, args, account));
      if (account.keyType === 'ed25519') promises.push(this.createEncryptKey(context, args, account));
    }
    const keys = await Promise.all(promises);

    return {
      did: builder.account.did,
      controllerKeyId: `${builder.account.did}#sign`,
      keys: keys,
      services: args.options?.services || [],
    }
  }

  async deleteIdentifier(args: IIdentifier, context: IAgentContext<IKeyManager>): Promise<boolean> {
    const managementKey = this.getManagementKey(args);
    const account = this.ltoAccount(managementKey);

    await new IdentityBuilder(account).deactivate().broadcastTo(this.lto.node);

    return true;
  }

  updateIdentifier(
    args: { did: string; document: Partial<DIDDocument>; options?: { [p: string]: any }; },
    context: IAgentContext<IKeyManager>,
  ): Promise<IIdentifier> {
    throw new Error('LtoDIDProvider updateIdentifier not supported');
  }

  async addKey(
    args: {
      identifier: IIdentifier;
      key: IKey;
      options?: { relationship?: TDIDRelationship | TDIDRelationship[], expires?: Date }
    },
    context: IAgentContext<IKeyManager>,
  ): Promise<Transaction[]> {
    const managementKey = this.getManagementKey(args.identifier);
    const account = this.ltoAccount(managementKey);

    const subAccount = this.ltoAccount(args.key);

    const builder = new IdentityBuilder(account);
    builder.addVerificationMethod(subAccount, args.options?.relationship, args.options?.expires);

    return this.broadcast(...builder.transactions);
  }

  async removeKey(
    args: { identifier: IIdentifier; kid: string; options?: any; },
    context: IAgentContext<IKeyManager>,
  ): Promise<Transaction[]> {
    const managementKey = this.getManagementKey(args.identifier);
    const account = this.ltoAccount(managementKey);

    const builder = new IdentityBuilder(account);
    builder.removeVerificationMethod(args.kid);

    return this.broadcast(...builder.transactions);
  }

  async addService(
    args: { identifier: IIdentifier; service: IService; options?: any; },
    context: IAgentContext<IKeyManager>,
  ): Promise<Transaction[]> {
    const managementKey = this.getManagementKey(args.identifier);
    const account = this.ltoAccount(managementKey);

    const builder = new IdentityBuilder(account);
    builder.addService(args.service);

    return this.broadcast(...builder.transactions);
  }

  async removeService(
    args: { identifier: IIdentifier; id: string; options?: any; },
    context: IAgentContext<IKeyManager>,
  ): Promise<Transaction[]> {
    const managementKey = this.getManagementKey(args.identifier);
    const account = this.ltoAccount(managementKey);

    const builder = new IdentityBuilder(account);
    builder.removeService(args.id);

    return this.broadcast(...builder.transactions);
  }
}
