import { ENV } from "../env.js";
import { getAddress } from "../utils/getAddress.js";
import { getPublishBytes } from "../utils/getPublishBytes.js";
import { getSigner } from "../utils/getSigner.js";
import { fromBase64 } from "@mysten/sui/utils";
import { SuiJsonRpcClient } from "@mysten/sui/jsonRpc";
import { execSync } from "node:child_process";
import * as fs from "fs";
import path from "node:path";

/**
 * Publishes the specified Move package to the specified Sui network.
 * Stores the response details in data/publish.json.
 *
 * Uses the Core API (suiClient.core) so the script works identically
 * regardless of transport (JSON-RPC, gRPC, GraphQL).
 */
export const publish = async () => {
  if (!ENV.MOVE_PACKAGE_PATH) {
    throw new Error("MOVE_PACKAGE_PATH is not defined in the .env");
  }
  if (!ENV.ADMIN_SECRET_KEY) {
    throw new Error("ADMIN_SECRET_KEY is not defined in the .env");
  }

  const suiClient = new SuiJsonRpcClient({
    url: ENV.SUI_FULLNODE_URL,
    network: ENV.SUI_NETWORK,
  });

  const signer = getSigner(ENV.ADMIN_SECRET_KEY);
  const address = getAddress(ENV.ADMIN_SECRET_KEY);

  const unsignedBytes = await getPublishBytes({
    packagePath: ENV.MOVE_PACKAGE_PATH,
    suiClient,
    sender: address,
    exec: execSync as any,
  });

  const result = await suiClient.core.signAndExecuteTransaction({
    transaction: fromBase64(unsignedBytes),
    signer,
    include: { effects: true, objectChanges: true },
  });

  const tx = result.Transaction ?? result.FailedTransaction;
  if (!tx || !tx.status.success) {
    console.error("Publish transaction failed");
    console.error(JSON.stringify(tx?.status.error, null, 2));
    return;
  }

  console.log("Publish transaction successful");
  if (!fs.existsSync("data")) {
    fs.mkdirSync("data");
  }
  fs.writeFileSync(
    ["data", "publish.json"].join(path.sep),
    JSON.stringify(tx, null, 2),
  );
  console.log("Response details stored in data/publish.json");
};

publish();
