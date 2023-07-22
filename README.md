![LTO github readme](https://user-images.githubusercontent.com/100821/196711741-96cd4ba5-932a-4e95-b420-42d4d61c21fd.png)

# Identity Vault

Server side wallet for managing identities and verifiable credentials.

## Configuration

| variable name     | description                                                                                      | format                   | extra information                                                             |
|-------------------|--------------------------------------------------------------------------------------------------|--------------------------|-------------------------------------------------------------------------------|
| `LTO_NETWORK`     | Which network to attach the node to                                                              | `MAINNET`, `TESTNET`     | Default is set to `MAINNET`                                                   |
| `LTO_WALLET_SEED` | The seed of your wallet. Your wallet needs to have sufficient funds to sponsor the transactions. | string                   | Can also be set as `LTO_WALLET_SEED_BASE58`, which will take a `base58` value |
| `NODE_URL`        | The URL of the public node.                                                                      | string                   |                                                                               |

## Run

```bash
yarn start
```

The default identifier is automatically be created when the first credential is issued, if it doesn't exist.
