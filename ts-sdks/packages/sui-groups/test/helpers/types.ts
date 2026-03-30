// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

export interface Account {
	keypair: Ed25519Keypair;
	address: string;
}

/**
 * Serializable version of Account for Vitest provide/inject.
 * The secret key (bech32 encoded) can be used to reconstruct the keypair.
 */
export interface SerializableAccount {
	secretKey: string;
	address: string;
}

/**
 * Configuration for a Move package to be published during test setup.
 */
export interface MovePackageConfig {
	/** Name identifier for the package */
	name: string;
	/** A module that creates objects in init (used to match published deps to configs via object types) */
	moduleName: string;
	/** Local path relative to repository root */
	localPath: string;
	/** Path inside the test container */
	containerPath: string;
}

/**
 * An object created during a Move package publish transaction.
 */
export interface CreatedObject {
	objectId: string;
	objectType: string;
}

/**
 * Result of publishing a Move package.
 */
export interface PublishedPackage {
	packageId: string;
	createdObjects: CreatedObject[];
}

/**
 * Map of package names to their published info.
 */
export type PublishedPackages = Record<string, PublishedPackage>;

/**
 * Base context provided to all test suites.
 */
export interface BaseTestContext {
	localnetPort: number;
	graphqlPort: number;
	faucetPort: number;
	suiToolsContainerId: string;
	suiClient: ClientWithCoreApi;
	adminAccount: Account;
}

/**
 * Extended context with published packages.
 */
export interface TestContextWithPackages extends BaseTestContext {
	publishedPackages: PublishedPackages;
}
