import { agent } from '../setup.js';
import { Request, Response } from 'express';
import { CredentialStatus } from '@veramo/core';

export async function getStatus(hash: string): Promise<CredentialStatus> {
  const credential = await agent.dataStoreGetVerifiableCredential({ hash });
  return await agent.checkCredentialStatus({ credential });
}

export async function route(req: Request, res: Response) {
  try {
    const status = await getStatus(req.params.hash);
    res.status(200).json(status);
  } catch (err) {
    const isNotFound = err instanceof Error && err.message.startsWith('not_found:');
    res.status(isNotFound ? 404 : 500).json({ error: err instanceof Error ? err.message : err });
  }
}
