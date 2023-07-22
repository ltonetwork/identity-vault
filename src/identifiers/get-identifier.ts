import { agent } from '../setup.js';
import { IIdentifier } from '@veramo/core';
import { redact } from './redact.js';
import { Request, Response } from 'express';

async function get(id: string): Promise<IIdentifier> {
  const identifier = id.startsWith('did:')
    ? await agent.didManagerGet({ did: id })
    : await agent.didManagerGetByAlias( { alias: id });

  return redact(identifier);
}

export async function route(req: Request, res: Response) {
  try {
    res.status(200).json(await get(req.params.did));
  } catch (err) {
    const isNotFound = err instanceof Error && err.message === 'Identifier not found';
    res.status(isNotFound ? 404 : 500).json({ error: err instanceof Error ? err.message : err });
  }
}
