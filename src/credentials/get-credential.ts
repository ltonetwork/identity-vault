import { agent } from '../setup.js';
import { Request, Response } from 'express';
import { VerifiableCredential } from '@veramo/core';

export async function get(hash: string): Promise<VerifiableCredential> {
  return await agent.dataStoreGetVerifiableCredential({ hash });
}

export async function route(req: Request, res: Response) {
  try {
    const credential = await get(req.params.hash);
    res.status(200).json(credential);
  } catch (err) {
    const isNotFound = err instanceof Error && err.message.startsWith('not_found:');
    res.status(isNotFound ? 404 : 500).json({ error: err instanceof Error ? err.message : err });
  }
}
