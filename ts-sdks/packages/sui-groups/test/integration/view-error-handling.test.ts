// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, inject, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';

import { SuiGroupsView } from '../../src/view.js';
import { createSuiGroupsClient } from '../helpers/index.js';

const MOCK_PACKAGE_ID = '0x' + 'ff'.repeat(32);
const MOCK_PACKAGE_CONFIG = {
	originalPackageId: MOCK_PACKAGE_ID,
	latestPackageId: MOCK_PACKAGE_ID,
};
const MOCK_WITNESS_TYPE = `${MOCK_PACKAGE_ID}::my_module::MyWitness`;

// A port that is almost certainly not listening — used to trigger transport errors.
const DEAD_URL = 'http://127.0.0.1:1';
const FAKE_GROUP_ID = '0x' + 'aa'.repeat(32);
const FAKE_MEMBER = '0x' + 'bb'.repeat(32);

describe('SuiGroupsView error handling', () => {
	// ─── Object not found (should return null/false, not throw) ────────────

	describe('object not found — returns gracefully', () => {
		let suiClient: ReturnType<typeof createSuiGroupsClient>;
		let groupId: string;

		beforeAll(async () => {
			const suiClientUrl = inject('suiClientUrl');
			const publishedPackages = inject('publishedPackages');
			const adminAccount = inject('adminAccount');

			const packageId = publishedPackages['permissioned-groups'].packageId;
			const exampleGroupPackageId = publishedPackages['example-group'].packageId;
			const witnessType = `${exampleGroupPackageId}::example_group::ExampleGroupWitness`;

			const adminKeypair = Ed25519Keypair.fromSecretKey(adminAccount.secretKey);
			const adminAddress = adminAccount.address;

			suiClient = createSuiGroupsClient({
				url: suiClientUrl,
				network: 'localnet',
				packageId,
				witnessType,
				exampleGroupPackageId,
				mvr: {
					overrides: {
						packages: { '@local-pkg/sui-groups': packageId },
					},
				},
			});

			// Create a shared group
			const tx = suiClient.exampleGroup.createAndShareGroupTx(adminAddress);
			const result = await suiClient.core.signAndExecuteTransaction({
				transaction: tx,
				signer: adminKeypair,
				include: { effects: true, objectTypes: true },
			});

			const txResult = result.Transaction ?? result.FailedTransaction;
			if (!txResult || !txResult.status.success) {
				throw new Error('Transaction failed');
			}

			await suiClient.core.waitForTransaction({ result });

			const createdGroup = txResult.effects!.changedObjects.find((obj) => {
				const objType = txResult.objectTypes?.[obj.objectId];
				return obj.idOperation === 'Created' && objType?.includes('PermissionedGroup');
			});

			if (!createdGroup) {
				throw new Error('Failed to find created PermissionedGroup');
			}

			groupId = createdGroup.objectId;
		});

		it('isMember returns false for a non-member', async () => {
			const randomAddress = new Ed25519Keypair().getPublicKey().toSuiAddress();
			const result = await suiClient.groups.view.isMember({
				groupId,
				member: randomAddress,
			});
			expect(result).toBe(false);
		});

		it('hasPermission returns false for a non-member', async () => {
			const randomAddress = new Ed25519Keypair().getPublicKey().toSuiAddress();
			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: randomAddress,
				permissionType: `${MOCK_PACKAGE_ID}::some_module::SomePermission`,
			});
			expect(result).toBe(false);
		});

		it('isPaused returns false for a non-paused group', async () => {
			const result = await suiClient.groups.view.isPaused({ groupId });
			expect(result).toBe(false);
		});
	});

	// ─── Transport errors (should throw, not swallow) ─────────────────────

	describe('transport errors — JSON-RPC client', () => {
		let view: SuiGroupsView;

		beforeAll(() => {
			const client = new SuiJsonRpcClient({ url: DEAD_URL, network: 'localnet' });
			view = new SuiGroupsView({
				packageConfig: MOCK_PACKAGE_CONFIG,
				witnessType: MOCK_WITNESS_TYPE,
				client,
			});
		});

		it('isMember propagates transport error', async () => {
			await expect(
				view.isMember({ groupId: FAKE_GROUP_ID, member: FAKE_MEMBER }),
			).rejects.toThrow();
		});

		it('hasPermission propagates transport error', async () => {
			await expect(
				view.hasPermission({
					groupId: FAKE_GROUP_ID,
					member: FAKE_MEMBER,
					permissionType: `${MOCK_PACKAGE_ID}::m::P`,
				}),
			).rejects.toThrow();
		});

		it('isPaused propagates transport error', async () => {
			await expect(view.isPaused({ groupId: FAKE_GROUP_ID })).rejects.toThrow();
		});
	});

	describe('transport errors — gRPC client', () => {
		let view: SuiGroupsView;

		beforeAll(() => {
			const client = new SuiGrpcClient({ baseUrl: DEAD_URL, network: 'localnet' });
			view = new SuiGroupsView({
				packageConfig: MOCK_PACKAGE_CONFIG,
				witnessType: MOCK_WITNESS_TYPE,
				client,
			});
		});

		it('isMember propagates transport error', async () => {
			await expect(
				view.isMember({ groupId: FAKE_GROUP_ID, member: FAKE_MEMBER }),
			).rejects.toThrow();
		});

		it('hasPermission propagates transport error', async () => {
			await expect(
				view.hasPermission({
					groupId: FAKE_GROUP_ID,
					member: FAKE_MEMBER,
					permissionType: `${MOCK_PACKAGE_ID}::m::P`,
				}),
			).rejects.toThrow();
		});

		it('isPaused propagates transport error', async () => {
			await expect(view.isPaused({ groupId: FAKE_GROUP_ID })).rejects.toThrow();
		});
	});

	describe('transport errors — GraphQL client', () => {
		let view: SuiGroupsView;

		beforeAll(() => {
			const client = new SuiGraphQLClient({ url: DEAD_URL, network: 'localnet' });
			view = new SuiGroupsView({
				packageConfig: MOCK_PACKAGE_CONFIG,
				witnessType: MOCK_WITNESS_TYPE,
				client,
			});
		});

		it('isMember propagates transport error', async () => {
			await expect(
				view.isMember({ groupId: FAKE_GROUP_ID, member: FAKE_MEMBER }),
			).rejects.toThrow();
		});

		it('hasPermission propagates transport error', async () => {
			await expect(
				view.hasPermission({
					groupId: FAKE_GROUP_ID,
					member: FAKE_MEMBER,
					permissionType: `${MOCK_PACKAGE_ID}::m::P`,
				}),
			).rejects.toThrow();
		});

		it('isPaused propagates transport error', async () => {
			await expect(view.isPaused({ groupId: FAKE_GROUP_ID })).rejects.toThrow();
		});
	});
});
