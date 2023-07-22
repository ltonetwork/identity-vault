import { agent } from '../setup.js';
import { Request, Response } from 'express';
import { TCredentialColumns, Where } from '@veramo/core';

async function list(query: { issuer?: string, subject?: string }) {
  const where: Where<TCredentialColumns>[] = [];

  if (query.issuer) where.push({ column: 'issuer', value: [query.issuer] });
  if (query.subject) where.push({ column: 'subject', value: [query.subject] });

  const list = await agent.dataStoreORMGetVerifiableCredentials({ where });

  return list.map(({ hash, verifiableCredential }) => ({
    hash,
    id: verifiableCredential.id,
    issuer: typeof verifiableCredential.issuer === 'string'
      ? verifiableCredential.issuer
      : verifiableCredential.issuer.id,
    subject: verifiableCredential.credentialSubject.id,
    type: verifiableCredential.type,
    issuanceDate: verifiableCredential.issuanceDate,
  }));
}

export async function route(req: Request, res: Response) {
  res.json(await list(req.query));
}
