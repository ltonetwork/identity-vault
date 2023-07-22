import { agent } from '../setup.js';
import { CredentialPayload, VerifiableCredential } from '@veramo/core';
import { Request, Response } from 'express';

async function issue(
  credential: Partial<CredentialPayload>,
  { keyRef, proofFormat }: { keyRef?: string; proofFormat?: 'jwt' | 'lds' } = {},
): Promise<{ hash: string; verifiableCredential: VerifiableCredential }> {
  if (!credential.issuer) {
    const identifier = await agent.didManagerGetByAlias({ alias: 'default' });
    if (!identifier) throw Error('No default identifier');

    credential.issuer = identifier.did;
  }

  // Not supported yet
  /* const versionTime = new Date().toISOString().replace(/\.[0-9]{3}Z$/, 'Z');
  if (typeof credential.issuer === 'string') {
    credential.issuer += '?versionTime=' + versionTime;
  } else {
    credential.issuer.id += '?versionTime=' + versionTime;
  } */

  const verifiableCredential = await agent.createVerifiableCredential({
    credential: credential as CredentialPayload,
    proofFormat: proofFormat || 'jwt',
    keyRef,
  });

  const hash = await agent.dataStoreSaveVerifiableCredential( { verifiableCredential } );

  return { hash, verifiableCredential };
}

export async function route(req: Request, res: Response) {
  try {
    const credential = await issue(req.body);
    res.status(200).json(credential);
  } catch (err) {
    const isUserError =
      err instanceof Error &&
      (err.message.startsWith('not_found:') || err.message.startsWith('key_already_exists:'));

    res.status(isUserError ? 400 : 500).json({ error: err instanceof Error ? err.message : err });
  }
}
