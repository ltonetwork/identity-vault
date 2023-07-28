import { agent } from '../setup.js';
import { Request, Response } from 'express';

type StatusType = 'issue' | 'revoke' | 'suspend' | 'reinstate' | 'dispute' | 'acknowledge';

export async function updateStatus(
  hash: string,
  options: { status: StatusType, [_: string]: any },
): Promise<void> {
  const credential = await agent.dataStoreGetVerifiableCredential({ hash });
  await agent.credentialStatusUpdate({ vc: credential, options });
}

export async function route(req: Request, res: Response) {
  try {
    await updateStatus(req.params.hash, req.body);
    res.status(202).end();
  } catch (err) {
    console.error(err);
    const isNotFound = err instanceof Error && err.message.startsWith('not_found:');
    const isBadRequest = err instanceof Error &&
      (err.message.startsWith('invalid_argument:') || err.message.startsWith('missing_argument:'));
    res.status(isNotFound ? 404 : isBadRequest ? 400 : 500).json({ error: err instanceof Error ? err.message : err });
  }
}
