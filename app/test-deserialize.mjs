import { Transaction } from '@midnight-ntwrk/ledger-v8';
const raw = new Uint8Array([0, 1, 2, 3]);
try {
  const tx = Transaction.deserialize("SignatureEnabled", "PreProof", "PreBinding", raw);
  console.log("Success", !!tx);
} catch (e) {
  console.error("Failed", e);
}
