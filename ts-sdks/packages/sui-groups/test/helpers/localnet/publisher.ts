// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi } from '@mysten/sui/client';
// oxlint-disable-next-line eslint-plugin-import(extensions) -- path alias, not a real package
import { testPublish } from '@publish-utils';
import type { CreatedObject, MovePackageConfig, PublishedPackage } from '../types.js';
import { execCommand } from './exec-command.js';

/**
 * Queries the chain to get all objects created during a package's publish transaction,
 * plus the module names found in those object types.
 *
 * Works with both SuiGrpcClient and SuiJsonRpcClient via the core API.
 */
async function getPackageInfo(
	suiClient: ClientWithCoreApi,
	packageId: string,
): Promise<{ createdObjects: CreatedObject[]; moduleNames: string[] }> {
	const { object } = await suiClient.core.getObject({
		objectId: packageId,
		include: { previousTransaction: true },
	});

	const { Transaction, FailedTransaction } = await suiClient.core.getTransaction({
		digest: object.previousTransaction!,
		include: { effects: true, objectTypes: true },
	});

	const txResult = Transaction ?? FailedTransaction;
	if (!txResult?.effects) return { createdObjects: [], moduleNames: [] };

	const objectTypes = txResult.objectTypes ?? {};
	const moduleNames = new Set<string>();

	const createdObjects = txResult.effects.changedObjects
		.filter((obj) => {
			if (obj.idOperation !== 'Created') return false;
			const type = objectTypes[obj.objectId] ?? '';
			return type !== 'package' && !type.includes('UpgradeCap');
		})
		.map((obj) => {
			const type = objectTypes[obj.objectId] ?? 'unknown';
			// Extract module name from type string: "{packageId}::{module}::{Type}"
			const parts = type.split('::');
			if (parts.length >= 2) {
				moduleNames.add(parts[1]);
			}
			return { objectId: obj.objectId, objectType: type };
		});

	return { createdObjects, moduleNames: [...moduleNames] };
}

/**
 * Publishes Move packages using `test-publish --publish-unpublished-deps` on the
 * root package (last in the list). Then queries the chain to match each dependency
 * package ID back to its config entry using module names.
 *
 * Returns a Record keyed by config name with packageId and createdObjects.
 */
export async function publishPackages({
	packages,
	suiClient,
	suiToolsContainerId,
}: {
	packages: MovePackageConfig[];
	suiClient: ClientWithCoreApi;
	suiToolsContainerId: string;
}): Promise<Record<string, PublishedPackage>> {
	if (packages.length === 0) return {};

	// Publish the root package (last in the list) with all its dependencies
	const rootConfig = packages[packages.length - 1];
	console.log(`Publishing ${rootConfig.name} with dependencies...`);

	const result = await testPublish({
		packagePath: rootConfig.containerPath,
		exec: async (command) => execCommand(command.split(' '), suiToolsContainerId),
		buildEnv: 'localnet',
		publishUnpublishedDeps: packages.length > 1,
	});

	if (result.publishedPackages.length === 0) {
		throw new Error(`No packages were published`);
	}

	// Root package is always the last in publishedPackages
	const rootPkg = result.publishedPackages[result.publishedPackages.length - 1];
	console.log(`Published ${rootConfig.name} at ${rootPkg.packageId}`);

	// Collect all package IDs to query: deps + root
	const allPackageIds = [...result.dependencyPackageIds, rootPkg.packageId];

	// Query the chain for each package's created objects and module names
	const packageInfoMap = new Map<
		string,
		{ packageId: string; createdObjects: CreatedObject[]; moduleNames: string[] }
	>();
	for (const pkgId of allPackageIds) {
		const info = await getPackageInfo(suiClient, pkgId);
		packageInfoMap.set(pkgId, { packageId: pkgId, ...info });
		console.log(
			`  Package ${pkgId}: ${info.createdObjects.length} created objects, modules: [${info.moduleNames.join(', ')}]`,
		);
	}

	const results: Record<string, PublishedPackage> = {};

	// Match dependency configs to their package IDs using moduleName
	const dependencyConfigs = packages.slice(0, -1);
	const matchedIds = new Set<string>();

	for (const depConfig of dependencyConfigs) {
		const match = [...packageInfoMap.entries()].find(
			([id, info]) =>
				!matchedIds.has(id) && info.moduleNames.some((m) => m === depConfig.moduleName),
		);

		if (match) {
			const [id, info] = match;
			results[depConfig.name] = { packageId: info.packageId, createdObjects: info.createdObjects };
			matchedIds.add(id);
			console.log(`Mapped ${depConfig.name} to ${info.packageId}`);
		} else {
			console.warn(
				`Could not match ${depConfig.name} (moduleName: ${depConfig.moduleName}) to any package`,
			);
		}
	}

	// Try to match remaining unmatched deps by elimination
	const unmatchedConfigs = dependencyConfigs.filter((c) => !results[c.name]);
	const unmatchedIds = result.dependencyPackageIds.filter((id) => !matchedIds.has(id));

	if (unmatchedConfigs.length === 1 && unmatchedIds.length === 1) {
		const config = unmatchedConfigs[0];
		const id = unmatchedIds[0];
		const info = packageInfoMap.get(id)!;
		results[config.name] = { packageId: info.packageId, createdObjects: info.createdObjects };
		console.log(`Mapped ${config.name} to ${info.packageId} (by elimination)`);
	} else if (unmatchedConfigs.length > 0) {
		throw new Error(
			`Could not match ${unmatchedConfigs.length} dependency configs: ${unmatchedConfigs.map((c) => c.name).join(', ')}`,
		);
	}

	// Root package
	const rootInfo = packageInfoMap.get(rootPkg.packageId)!;
	results[rootConfig.name] = {
		packageId: rootInfo.packageId,
		createdObjects: rootInfo.createdObjects,
	};

	return results;
}
