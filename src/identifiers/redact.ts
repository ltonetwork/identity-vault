import { IIdentifier } from '@veramo/core';

export function redact(identifier: IIdentifier): IIdentifier {
  for (const key of identifier.keys) {
    delete key.privateKeyHex;
    delete key.meta?.seed;
    delete key.meta?.nonce;
  }

  return identifier;
}
