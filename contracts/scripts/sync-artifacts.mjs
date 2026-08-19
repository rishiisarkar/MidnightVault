import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const contractsRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(contractsRoot, "..");
const source = resolve(contractsRoot, "src", "managed");
const target = resolve(repoRoot, "app", "public", "contract", "Midnight");

const required = [
  "contract/index.js",
  "contract/index.d.ts",
  "compiler/contract-info.json",
  "zkir/add_valid_credential.bzkir",
  "zkir/verify_access.bzkir",
  "keys/add_valid_credential.prover",
  "keys/verify_access.prover",
];

for (const relativePath of required) {
  if (!existsSync(resolve(source, relativePath))) {
    throw new Error(`Missing generated Compact artifact: ${relativePath}`);
  }
}

await mkdir(resolve(target, ".."), { recursive: true });
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
for (const directory of ["contract", "compiler", "keys", "zkir"]) {
  await cp(resolve(source, directory), resolve(target, directory), { recursive: true });
}

console.log(`Synced Compact artifacts from ${source} to ${target}`);
