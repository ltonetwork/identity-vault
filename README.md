![LTO github readme](https://user-images.githubusercontent.com/100821/196711741-96cd4ba5-932a-4e95-b420-42d4d61c21fd.png)

# Identity Vault

Server-side wallet for managing identities and verifiable credentials.

## Configuration

| variable name     | description                                                                                      | format               | extra information                                                                     |
|-------------------|--------------------------------------------------------------------------------------------------|----------------------|---------------------------------------------------------------------------------------|
| `LTO_NETWORK`     | Which network to attach to                                                                       | `MAINNET`, `TESTNET` | Default is set to `TESTNET`                                                           |
| `LTO_WALLET_SEED` | The seed of your wallet. Your wallet needs to have sufficient funds to sponsor the transactions. | string               | Can also be set as `LTO_WALLET_SEED_BASE58`, which will take a `base58` value         |
| `NODE_URL`        | The URL of the public node.                                                                      | string               |                                                                                       |
| `INDEX_URL`       | The URL of the indexer.                                                                          | string               |                                                                                       |
| `PORT`            | The port on which the server will listen.                                                        | number               |                                                                                       |
| `KMS_SECRET_KEY`  | The secret key of the KMS.                                                                       | string               | Defaults to the base58 encoded sha256 hash of the seed.                               |
| `VAULT_DB_DSN`    | The DSN of the database.                                                                         | string               | Example `postgres:host=localhost;database=lto_vault;username=lto_vault;password=open` |

## Run

```bash
yarn start
```

The default identifier is automatically be created when the first credential is issued, if it doesn't exist.
