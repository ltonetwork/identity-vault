import { agent } from './veramo/setup.js';

async function main() {
  const identifier = await agent.didManagerGetByAlias({ alias: 'default' });
  const versionTime = new Date().toISOString().replace(/\.[0-9]{3}Z$/, 'Z');

  const verifiableCredential = await agent.createVerifiableCredential({
    credential: {
      issuer: { id: identifier.did },
      credentialSubject: {
        id: 'did:web:example.com',
        you: 'Rock',
      },
    },
    proofFormat: 'jwt',
  });
  console.log(`New credential created`);
  console.log(JSON.stringify(verifiableCredential, null, 2));
}

main().catch(console.log);
