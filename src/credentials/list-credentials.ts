import { agent } from '../setup.js';

async function main() {
  const credentials = await agent.dataStoreORMGetVerifiableCredentials({
    where: [ { column: 'issuer', op: 'Like', value: ['did:lto:3MrxjQnUjTDU5wjjCRwoCyDZPcCm2Ui3t4y%'] } ]
  });
  //{ where: [ { column: 'issuer', value: ['did:lto:3MrxjQnUjTDU5wjjCRwoCyDZPcCm2Ui3t4y'] } ] }

  console.log(`There are ${credentials.length} credentials`);

  if (credentials.length > 0) {
    credentials.map((credential) => {
      console.log(credential);
      console.log('..................');
    });
  }
}

main().catch(console.log);
