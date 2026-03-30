import { getSigner } from "./getSigner.js";

/**
 * Returns the Sui address associated with the provided base64-encoded secret key.
 *
 * @param secretKey - A base64-encoded string representing the secret key.
 * @returns The Sui address as a string.
 */
export const getAddress = (secretKey: string) => {
  const signer = getSigner(secretKey);
  return signer.toSuiAddress();
};
