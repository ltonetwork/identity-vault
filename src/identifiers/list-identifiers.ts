import { agent } from '../setup.js';
import { Request, Response } from 'express';

export async function list() {
  const identifiers = await agent.didManagerFind();

  return identifiers
    .sort((a) => a.alias === 'default' ? -1 : 0)
    .map((document) => ({
      did: document.did,
      alias: document.alias,
      keys: document.keys
        .sort((a) => a.kid === `${document.did}#sign` ? -1 : 0)
        .map((key) => ({
          kid: key.kid,
          type: key.type,
          publicKeyHex: key.publicKeyHex,
        })),
    }));
}

export async function route(req: Request, res: Response) {
  try {
    res.status(200).json(await list());
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : err });
  }
}
