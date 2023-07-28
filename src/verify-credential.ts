import { agent } from './veramo/setup.js';

async function main() {
  const result = await agent.verifyCredential({
    credential: {
      "credentialSubject": {
        "you": "Rock",
        "id": "did:web:example.com"
      },
      "issuer": {
        "id": "did:lto:3NBcx7AQqDopBj3WfwCVARNYuZyt1L9xEVM"
      },
      "type": [
        "VerifiableCredential"
      ],
      "credentialStatus": {
        "id": "BFTCv2YA3YhaYWAADit4mW1gzxF66SxajxauJbejdPSJ",
        "type": "LtoStatusRegistry2023"
      },
      "@context": [
        "https://www.w3.org/2018/credentials/v1"
      ],
      "issuanceDate": "2023-07-28T06:28:14.000Z",
      "proof": {
        "type": "JwtProof2020",
        "jwt": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJ2YyI6eyJAY29udGV4dCI6WyJodHRwczovL3d3dy53My5vcmcvMjAxOC9jcmVkZW50aWFscy92MSJdLCJ0eXBlIjpbIlZlcmlmaWFibGVDcmVkZW50aWFsIl0sImNyZWRlbnRpYWxTdWJqZWN0Ijp7InlvdSI6IlJvY2sifSwiY3JlZGVudGlhbFN0YXR1cyI6eyJpZCI6IkJGVEN2MllBM1loYVlXQUFEaXQ0bVcxZ3p4RjY2U3hhanhhdUpiZWpkUFNKIiwidHlwZSI6Ikx0b1N0YXR1c1JlZ2lzdHJ5MjAyMyJ9fSwic3ViIjoiZGlkOndlYjpleGFtcGxlLmNvbSIsIm5iZiI6MTY5MDUyNTY5NCwiaXNzIjoiZGlkOmx0bzozTkJjeDdBUXFEb3BCajNXZndDVkFSTll1Wnl0MUw5eEVWTSJ9.pFhJGgmar4j5pey-ev05fhbhs6B8WjHWVbmY0_JzUZZDIIlHwMzwH0S4Du0ina9_Wb9fj-6K9TVDJ-A62-odBQ"
      }
    }
  });
  console.log(`Credential verified`, result);
}

main().catch(console.log);
