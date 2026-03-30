import { z } from "zod";

const envSchema = z.object({
  SUI_NETWORK: z.enum(["mainnet", "testnet", "devnet", "localnet"]),
  SUI_FULLNODE_URL: z.url(),
  ADMIN_ADDRESS: z.string().optional(),
  ADMIN_SECRET_KEY: z.string().optional(),
  MOVE_PACKAGE_PATH: z.string().optional(),
});

export const ENV = envSchema.parse({
  SUI_NETWORK: process.env.SUI_NETWORK,
  SUI_FULLNODE_URL: process.env.SUI_FULLNODE_URL,
  ADMIN_ADDRESS: process.env.ADMIN_ADDRESS,
  ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
  MOVE_PACKAGE_PATH: process.env.MOVE_PACKAGE_PATH,
});
