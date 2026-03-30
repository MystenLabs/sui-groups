// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, inject, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { permissionTypes, actorObjectPermissionTypes } from '@mysten/sui-groups';

import { createSuiGroupsClient, createFundedAccount } from '../helpers/index.js';

describe('Full Flows', () => {
	let client: ReturnType<typeof createSuiGroupsClient>;
	let adminKeypair: Ed25519Keypair;
	let faucetUrl: string;

	/**
	 * Executes the `exampleGroup.createAndShareGroupTx` extension
	 * and returns the shared group's object ID.
	 */
	async function createAndShareGroup(): Promise<string> {
		const tx = client.exampleGroup.createAndShareGroupTx(
			adminKeypair.getPublicKey().toSuiAddress(),
		);

		const result = await client.core.signAndExecuteTransaction({
			transaction: tx,
			signer: adminKeypair,
			include: { effects: true, objectTypes: true },
		});

		const txResult = result.Transaction ?? result.FailedTransaction;
		if (!txResult || !txResult.status.success) {
			throw new Error('Failed to create group');
		}

		await client.core.waitForTransaction({ result });

		const created = txResult.effects!.changedObjects.find((obj) => {
			const objType = txResult.objectTypes?.[obj.objectId];
			return obj.idOperation === 'Created' && objType?.includes('PermissionedGroup');
		});

		if (!created) {
			throw new Error('Failed to find created PermissionedGroup in effects');
		}

		return created.objectId;
	}

	beforeAll(() => {
		const suiClientUrl = inject('suiClientUrl');
		const publishedPackages = inject('publishedPackages');
		const adminAccount = inject('adminAccount');
		const faucetPort = inject('faucetPort');

		const packageId = publishedPackages['permissioned-groups'].packageId;
		const exampleGroupPackageId = publishedPackages['example-group'].packageId;
		const witnessType = `${exampleGroupPackageId}::example_group::ExampleGroupWitness`;
		faucetUrl = `http://localhost:${faucetPort}`;

		adminKeypair = Ed25519Keypair.fromSecretKey(adminAccount.secretKey);

		client = createSuiGroupsClient({
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
	});

	describe('grant -> verify -> revoke -> verify', () => {
		it('should grant permission, verify it exists, revoke it, verify it is gone', async () => {
			const groupId = await createAndShareGroup();

			const member = await createFundedAccount({ faucetUrl });
			const memberAddress = member.address;

			const packageId = inject('publishedPackages')['permissioned-groups'].packageId;
			const permissionType = permissionTypes(packageId).PermissionsAdmin;

			await client.groups.grantPermission({
				groupId,
				member: memberAddress,
				permissionType,
				signer: adminKeypair,
			});

			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: memberAddress,
					permissionType,
				}),
			).toBe(true);

			await client.groups.revokePermission({
				groupId,
				member: memberAddress,
				permissionType,
				signer: adminKeypair,
			});

			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: memberAddress,
					permissionType,
				}),
			).toBe(false);
		});

		it('should auto-remove member when last permission is revoked', async () => {
			const groupId = await createAndShareGroup();

			const member = await createFundedAccount({ faucetUrl });
			const memberAddress = member.address;

			const packageId = inject('publishedPackages')['permissioned-groups'].packageId;
			const permissionType = permissionTypes(packageId).PermissionsAdmin;

			await client.groups.grantPermission({
				groupId,
				member: memberAddress,
				permissionType,
				signer: adminKeypair,
			});

			expect(await client.groups.view.isMember({ groupId, member: memberAddress })).toBe(true);

			await client.groups.revokePermission({
				groupId,
				member: memberAddress,
				permissionType,
				signer: adminKeypair,
			});

			expect(await client.groups.view.isMember({ groupId, member: memberAddress })).toBe(false);
		});
	});

	describe('GroupDeleter permission', () => {
		it('should grant GroupDeleter, verify it, revoke it, verify it is gone', async () => {
			const groupId = await createAndShareGroup();

			const member = await createFundedAccount({ faucetUrl });
			const memberAddress = member.address;

			const packageId = inject('publishedPackages')['permissioned-groups'].packageId;
			const permissionType = permissionTypes(packageId).GroupDeleter;

			await client.groups.grantPermission({
				groupId,
				member: memberAddress,
				permissionType,
				signer: adminKeypair,
			});

			expect(
				await client.groups.view.hasPermission({ groupId, member: memberAddress, permissionType }),
			).toBe(true);

			await client.groups.revokePermission({
				groupId,
				member: memberAddress,
				permissionType,
				signer: adminKeypair,
			});

			expect(
				await client.groups.view.hasPermission({ groupId, member: memberAddress, permissionType }),
			).toBe(false);
		});
	});

	describe('addMembers', () => {
		it('should add multiple members with permissions in a single transaction', async () => {
			const groupId = await createAndShareGroup();

			const packageId = inject('publishedPackages')['permissioned-groups'].packageId;
			const perms = permissionTypes(packageId);
			const actorPerms = actorObjectPermissionTypes(packageId);

			const member1 = await createFundedAccount({ faucetUrl });
			const member2 = await createFundedAccount({ faucetUrl });

			await client.groups.addMembers({
				groupId,
				members: [
					{ address: member1.address, permissions: [perms.PermissionsAdmin] },
					{
						address: member2.address,
						permissions: [perms.ExtensionPermissionsAdmin, actorPerms.ObjectAdmin],
					},
				],
				signer: adminKeypair,
			});

			expect(await client.groups.view.isMember({ groupId, member: member1.address })).toBe(true);
			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: member1.address,
					permissionType: perms.PermissionsAdmin,
				}),
			).toBe(true);

			expect(await client.groups.view.isMember({ groupId, member: member2.address })).toBe(true);
			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: member2.address,
					permissionType: perms.ExtensionPermissionsAdmin,
				}),
			).toBe(true);
			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: member2.address,
					permissionType: actorPerms.ObjectAdmin,
				}),
			).toBe(true);
		});

		it('should add permissions to an existing member without errors', async () => {
			const groupId = await createAndShareGroup();

			const packageId = inject('publishedPackages')['permissioned-groups'].packageId;
			const perms = permissionTypes(packageId);
			const actorPerms = actorObjectPermissionTypes(packageId);

			const member = await createFundedAccount({ faucetUrl });

			await client.groups.grantPermission({
				groupId,
				member: member.address,
				permissionType: perms.PermissionsAdmin,
				signer: adminKeypair,
			});

			await client.groups.addMembers({
				groupId,
				members: [
					{
						address: member.address,
						permissions: [perms.ExtensionPermissionsAdmin, actorPerms.ObjectAdmin],
					},
				],
				signer: adminKeypair,
			});

			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: member.address,
					permissionType: perms.PermissionsAdmin,
				}),
			).toBe(true);
			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: member.address,
					permissionType: perms.ExtensionPermissionsAdmin,
				}),
			).toBe(true);
			expect(
				await client.groups.view.hasPermission({
					groupId,
					member: member.address,
					permissionType: actorPerms.ObjectAdmin,
				}),
			).toBe(true);
		});
	});

	describe('remove member', () => {
		it('should remove a member and verify they are no longer a member', async () => {
			const groupId = await createAndShareGroup();

			const member = await createFundedAccount({ faucetUrl });
			const memberAddress = member.address;

			const packageId = inject('publishedPackages')['permissioned-groups'].packageId;
			await client.groups.grantPermission({
				groupId,
				member: memberAddress,
				permissionType: permissionTypes(packageId).PermissionsAdmin,
				signer: adminKeypair,
			});

			expect(await client.groups.view.isMember({ groupId, member: memberAddress })).toBe(true);

			await client.groups.removeMember({
				groupId,
				member: memberAddress,
				signer: adminKeypair,
			});

			expect(await client.groups.view.isMember({ groupId, member: memberAddress })).toBe(false);
		});
	});
});
