// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, inject, beforeAll } from 'vitest';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { permissionTypes } from '@mysten/sui-groups';

import { createSuiGroupsClient, createFundedAccount } from '../helpers/index.js';

describe('SuiGroupsView', () => {
	let suiClient: ReturnType<typeof createSuiGroupsClient>;
	let adminKeypair: Ed25519Keypair;
	let adminAddress: string;
	let packageId: string;
	let groupId: string;

	beforeAll(async () => {
		const suiClientUrl = inject('suiClientUrl');
		const publishedPackages = inject('publishedPackages');
		const adminAccount = inject('adminAccount');

		packageId = publishedPackages['permissioned-groups'].packageId;
		const exampleGroupPackageId = publishedPackages['example-group'].packageId;
		const witnessType = `${exampleGroupPackageId}::example_group::ExampleGroupWitness`;

		adminKeypair = Ed25519Keypair.fromSecretKey(adminAccount.secretKey);
		adminAddress = adminAccount.address;

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

		// Create a shared group using exampleGroup extension
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

	describe('isMember', () => {
		it('should return true for the group creator', async () => {
			const result = await suiClient.groups.view.isMember({
				groupId,
				member: adminAddress,
			});

			expect(result).toBe(true);
		});

		it('should return false for a non-member address', async () => {
			const randomKeypair = new Ed25519Keypair();
			const randomAddress = randomKeypair.getPublicKey().toSuiAddress();

			const result = await suiClient.groups.view.isMember({
				groupId,
				member: randomAddress,
			});

			expect(result).toBe(false);
		});
	});

	describe('hasPermission', () => {
		it('should return true for PermissionsAdmin permission on creator', async () => {
			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: adminAddress,
				permissionType: permissionTypes(packageId).PermissionsAdmin,
			});

			expect(result).toBe(true);
		});

		it('should return true for ExtensionPermissionsAdmin permission on creator', async () => {
			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: adminAddress,
				permissionType: permissionTypes(packageId).ExtensionPermissionsAdmin,
			});

			expect(result).toBe(true);
		});

		it('should return false for a permission the creator does not have', async () => {
			const nonExistentPermissionType = `${packageId}::permissioned_group::NonExistentPermission`;

			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: adminAddress,
				permissionType: nonExistentPermissionType,
			});

			expect(result).toBe(false);
		});

		it('should return false for a non-member address', async () => {
			const randomKeypair = new Ed25519Keypair();
			const randomAddress = randomKeypair.getPublicKey().toSuiAddress();

			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: randomAddress,
				permissionType: permissionTypes(packageId).PermissionsAdmin,
			});

			expect(result).toBe(false);
		});
	});

	describe('after granting permission to new member', () => {
		let newMemberAddress: string;

		beforeAll(async () => {
			const faucetPort = inject('faucetPort');
			const faucetUrl = `http://localhost:${faucetPort}`;

			const newMember = await createFundedAccount({ faucetUrl });
			newMemberAddress = newMember.address;

			await suiClient.groups.grantPermission({
				groupId,
				member: newMemberAddress,
				permissionType: permissionTypes(packageId).PermissionsAdmin,
				signer: adminKeypair,
			});
		});

		it('should return true for isMember on new member', async () => {
			const result = await suiClient.groups.view.isMember({
				groupId,
				member: newMemberAddress,
			});

			expect(result).toBe(true);
		});

		it('should return true for hasPermission on granted permission', async () => {
			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: newMemberAddress,
				permissionType: permissionTypes(packageId).PermissionsAdmin,
			});

			expect(result).toBe(true);
		});

		it('should return false for hasPermission on non-granted permission', async () => {
			const result = await suiClient.groups.view.hasPermission({
				groupId,
				member: newMemberAddress,
				permissionType: permissionTypes(packageId).ExtensionPermissionsAdmin,
			});

			expect(result).toBe(false);
		});
	});

	describe('getMembers', () => {
		it('should return the creator as a member with their permissions', async () => {
			const result = await suiClient.groups.view.getMembers({ groupId });

			expect(result.members.length).toBeGreaterThanOrEqual(1);

			const creator = result.members.find((m) => m.address === adminAddress);
			expect(creator).toBeDefined();
			const permAdminType = permissionTypes(packageId).PermissionsAdmin.replace(/^0x/, '');
			const extPermAdminType = permissionTypes(packageId).ExtensionPermissionsAdmin.replace(
				/^0x/,
				'',
			);
			expect(creator!.permissions).toContain(permAdminType);
			expect(creator!.permissions).toContain(extPermAdminType);
		});

		it('should return all members when using exhaustive mode', async () => {
			const result = await suiClient.groups.view.getMembers({
				groupId,
				exhaustive: true,
			});

			expect(result.hasNextPage).toBe(false);
			expect(result.cursor).toBeNull();
			expect(result.members.length).toBeGreaterThanOrEqual(1);

			const creator = result.members.find((m) => m.address === adminAddress);
			expect(creator).toBeDefined();
		});

		it('should return only the creator for a freshly created group', async () => {
			const freshTx = suiClient.exampleGroup.createAndShareGroupTx(adminAddress);
			const freshResult = await suiClient.core.signAndExecuteTransaction({
				transaction: freshTx,
				signer: adminKeypair,
				include: { effects: true, objectTypes: true },
			});

			const freshTxResult = freshResult.Transaction ?? freshResult.FailedTransaction;
			if (!freshTxResult || !freshTxResult.status.success) {
				throw new Error('Transaction failed');
			}

			await suiClient.core.waitForTransaction({ result: freshResult });

			const freshGroup = freshTxResult.effects!.changedObjects.find((obj) => {
				const objType = freshTxResult.objectTypes?.[obj.objectId];
				return obj.idOperation === 'Created' && objType?.includes('PermissionedGroup');
			});

			const result = await suiClient.groups.view.getMembers({
				groupId: freshGroup!.objectId,
				exhaustive: true,
			});

			expect(result.members.length).toBe(1);
			expect(result.members[0].address).toBe(adminAddress);
		});

		it('should support paginated fetching with limit', async () => {
			const result = await suiClient.groups.view.getMembers({
				groupId,
				limit: 1,
			});

			expect(result.members.length).toBeLessThanOrEqual(1);
		});
	});

	describe('caching behavior', () => {
		it('should use cached permissions table ID for repeated queries', async () => {
			const result1 = await suiClient.groups.view.isMember({
				groupId,
				member: adminAddress,
			});

			const result2 = await suiClient.groups.view.isMember({
				groupId,
				member: adminAddress,
			});

			expect(result1).toBe(true);
			expect(result2).toBe(true);
		});
	});
});
