// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { suiGroups } from '@mysten/sui-groups';
import type { SuiGroupsClient } from '@mysten/sui-groups';
import type { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

import { createSuiClient, type SuiTransport } from './create-sui-client.js';

export interface CreateSuiGroupsClientOptions {
	url: string;
	network: SuiClientTypes.Network;
	transport?: SuiTransport;
	packageId: string;
	witnessType: string;
	exampleGroupPackageId: string;
	mvr?: SuiClientTypes.MvrOptions;
}

/**
 * Creates a fully extended Sui client with the `suiGroups` and
 * `exampleGroup` extensions.
 *
 * The `exampleGroup` extension provides a `createAndShareGroupTx` helper
 * that builds a transaction to create and publicly share a `PermissionedGroup`.
 *
 * Transport-agnostic: uses `SUI_TRANSPORT` env var or explicit `transport` option
 * to choose between JSON-RPC and gRPC.
 */
export function createSuiGroupsClient(options: CreateSuiGroupsClientOptions) {
	const { url, network, transport, packageId, witnessType, exampleGroupPackageId, mvr } = options;

	return createSuiClient({ url, network, transport, mvr })
		.$extend(
			suiGroups({
				packageConfig: { originalPackageId: packageId, latestPackageId: packageId },
				witnessType,
			}),
		)
		.$extend({
			name: 'exampleGroup' as const,
			register: (client: ClientWithCoreApi & { groups: SuiGroupsClient }) => ({
				createAndShareGroupTx(sender: string) {
					const tx = new Transaction();
					tx.setSender(sender);

					const group = tx.moveCall({
						package: exampleGroupPackageId,
						module: 'example_group',
						function: 'create_group',
					});

					tx.moveCall({
						package: '0x2',
						module: 'transfer',
						function: 'public_share_object',
						typeArguments: [client.groups.bcs.PermissionedGroup.name],
						arguments: [group],
					});

					return tx;
				},
			}),
		});
}
