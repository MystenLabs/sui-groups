import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { fromBase64 } from "@mysten/sui/utils";

/**
 * Returns an Ed25519Keypair signer derived from the provided base64-encoded secret key.
 *
 * @param secretKey - A base64-encoded string representing the secret key.
 * @returns An Ed25519Keypair instance that can be used as a signer.
 */
export const getSigner = (secretKey: string) => {
  return Ed25519Keypair.fromSecretKey(fromBase64(secretKey).slice(1));
};
