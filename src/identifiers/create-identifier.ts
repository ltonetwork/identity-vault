import { agent } from '../setup.js';
import { IIdentifier } from '@veramo/core';
import { redact } from './redact.js';
import { Request, Response } from 'express';

export async function create(input: { alias?: string, [_: string]: any } = {}): Promise<IIdentifier> {
  const { alias, ...options } = input;

  const identifier = await agent.didManagerCreate({ alias, options });

  return redact(identifier);
}

export async function route(req: Request, res: Response) {
  try {
    const identifier = await create(req.body);
    res.status(200).json(identifier);
  } catch (err) {
    const isUserError =
      err instanceof Error &&
      (err.message.startsWith('illegal_argument:') || err.message.startsWith('key_already_exists:'));

    res.status(isUserError ? 400 : 500).json({ error: err instanceof Error ? err.message : err });
  }
}
