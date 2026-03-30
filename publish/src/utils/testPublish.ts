import type { SuiObjectChange } from "@mysten/sui/jsonRpc";

export type BuildEnv = "localnet" | "devnet" | "testnet" | "mainnet";

export interface TestPublishResult {
  /** The digest of the publish transaction */
  digest: string;
  /** All object changes from the transaction (includes all published packages) */
  objectChanges: SuiObjectChange[];
  /** All packages that were published (root + dependencies) */
  publishedPackages: Array<{
    packageId: string;
    modules: string[];
  }>;
  /** Package IDs of dependencies (from transaction inputs, excludes MoveStdlib 0x1 and Sui 0x2) */
  dependencyPackageIds: string[];
}

/**
 * Publishes a Move package using `sui client test-publish`.
 * This command supports publishing packages with unpublished dependencies.
 *
 * @param packagePath - The file system path to the Move package to be published.
 * @param exec - A function to execute shell commands. Provides flexibility for testing in custom execution environments (eg TestContainers).
 * @param options.buildEnv - The build environment to use (localnet, devnet, testnet, mainnet). Required.
 * @param options.publishUnpublishedDeps - If true, also publishes transitive dependencies that have not already been published.
 * @param options.gasBudget - Gas budget for the transaction (default: 500000000 MIST).
 * @returns A Promise that resolves to the publish result containing all published package info.
 */
export const testPublish = async ({
  packagePath,
  exec,
  buildEnv,
  publishUnpublishedDeps = false,
  gasBudget = 500000000,
}: {
  packagePath: string;
  exec: (command: string) => Promise<string>;
  buildEnv: BuildEnv;
  publishUnpublishedDeps?: boolean;
  gasBudget?: number;
}): Promise<TestPublishResult> => {
  const args = [
    "sui",
    "client",
    "test-publish",
    packagePath,
    "--build-env",
    buildEnv,
    "--json",
    "--gas-budget",
    gasBudget.toString(),
  ];

  if (publishUnpublishedDeps) {
    args.push("--publish-unpublished-deps");
  }

  const output = await exec(args.join(" "));

  // Parse top-level JSON transaction objects from the CLI output.
  // The output may contain compiler warnings and build logs mixed in.
  // We search backwards from the end to find the largest valid JSON objects,
  // which are the transaction results we care about.
  const jsonOutputs: string[] = [];
  let searchEnd = output.length;
  while (searchEnd > 0) {
    // Find the last '}' before searchEnd
    const jsonEnd = output.lastIndexOf("}", searchEnd - 1);
    if (jsonEnd === -1) break;

    // Find its matching '{' by counting braces backwards
    let depth = 0;
    let jsonStart = -1;
    for (let i = jsonEnd; i >= 0; i--) {
      if (output[i] === "}") depth++;
      else if (output[i] === "{") {
        depth--;
        if (depth === 0) {
          jsonStart = i;
          break;
        }
      }
    }

    if (jsonStart === -1) break;

    const candidate = output.slice(jsonStart, jsonEnd + 1);
    try {
      JSON.parse(candidate);
      jsonOutputs.unshift(candidate); // prepend to maintain order
      searchEnd = jsonStart;
    } catch {
      // Not valid JSON — skip this closing brace and keep searching
      searchEnd = jsonEnd;
    }
  }

  if (jsonOutputs.length === 0) {
    throw new Error(`Failed to parse test-publish output: ${output}`);
  }

  // Parse all JSON outputs and collect all objectChanges
  const allObjectChanges: SuiObjectChange[] = [];
  let lastDigest = "";
  const dependencyPackageIds: string[] = [];

  // Standard library packages to exclude from dependencies
  const SYSTEM_PACKAGES = [
    "0x0000000000000000000000000000000000000000000000000000000000000001", // MoveStdlib
    "0x0000000000000000000000000000000000000000000000000000000000000002", // Sui
  ];

  for (let idx = 0; idx < jsonOutputs.length; idx++) {
    const parsed = JSON.parse(jsonOutputs[idx]);

    // v1.65+ uses "changed_objects" with objectType; older versions use "objectChanges" with type
    const objectChanges: SuiObjectChange[] =
      parsed.objectChanges ?? parsed.changed_objects ?? [];
    allObjectChanges.push(...objectChanges);

    if (parsed.digest) {
      lastDigest = parsed.digest;
    }
    // v1.65+ puts digest inside effects
    if (!lastDigest && parsed.effects?.V2?.transaction_digest) {
      lastDigest = parsed.effects.V2.transaction_digest;
    }

    // Extract dependency package IDs from transaction Publish inputs.
    // Older format path: transaction.data.transaction.transactions
    // v1.65+ format path: transaction.V1.kind.ProgrammableTransaction.commands
    const transactions =
      parsed.transaction?.data?.transaction?.transactions ??
      parsed.transaction?.V1?.kind?.ProgrammableTransaction?.commands ??
      [];
    for (const tx of transactions) {
      if (tx.Publish && Array.isArray(tx.Publish)) {
        // v1.65+: Publish = [bytecodeArrays, depIdArray]
        // Older: Publish = [depId1, depId2, ...]
        const depIds = tx.Publish[1];
        const candidates = Array.isArray(depIds) ? depIds : tx.Publish;
        for (const depId of candidates) {
          if (typeof depId === "string" && !SYSTEM_PACKAGES.includes(depId)) {
            dependencyPackageIds.push(depId);
          }
        }
      }
    }
  }

  const result = { digest: lastDigest, objectChanges: allObjectChanges };

  // Extract all published packages from objectChanges.
  // v1.65+ format: { objectType: "package", idOperation: "CREATED" }
  // Older format: { type: "published", packageId: "0x..." }
  const publishedChanges = result.objectChanges.filter(
    (change) =>
      (change as any).type === "published" ||
      ((change as any).objectType === "package" &&
        (change as any).idOperation === "CREATED"),
  );

  if (publishedChanges.length === 0) {
    throw new Error(`No packages were published. Output: ${output}`);
  }

  const publishedPackages = publishedChanges.map((change) => ({
    packageId: (change as any).packageId ?? (change as any).objectId,
    modules: (change as any).modules || [],
  }));

  return {
    digest: result.digest,
    objectChanges: result.objectChanges,
    publishedPackages,
    dependencyPackageIds,
  };
};
