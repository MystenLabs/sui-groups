// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { describe, it, expect, inject } from 'vitest';
import { permissionTypes } from '@mysten/sui-groups';

import { createSuiClient, createSuiGroupsClient } from '../helpers/index.js';

describe('permissioned-groups: Setup & Configuration', () => {
	it('should have published the packages', () => {
		const publishedPackages = inject('publishedPackages');
		expect(publishedPackages['permissioned-groups']).toBeDefined();
		expect(publishedPackages['permissioned-groups'].packageId).toBeDefined();
		expect(publishedPackages['example-group']).toBeDefined();
		expect(publishedPackages['example-group'].packageId).toBeDefined();
	});

	it('should have a working sui client', async () => {
		const suiClientUrl = inject('suiClientUrl');
		const adminAccount = inject('adminAccount');

		const suiClient = createSuiClient({ url: suiClientUrl, network: 'localnet' });
		const { balance } = await suiClient.core.getBalance({
			owner: adminAccount.address,
		});

		expect(BigInt(balance.balance)).toBeGreaterThan(0n);
	});

	it('should extend SuiClient with SuiGroupsClient and exampleGroup', () => {
		const suiClientUrl = inject('suiClientUrl');
		const publishedPackages = inject('publishedPackages');
		const packageId = publishedPackages['permissioned-groups'].packageId;
		const exampleGroupPackageId = publishedPackages['example-group'].packageId;
		const witnessType = `${exampleGroupPackageId}::example_group::ExampleGroupWitness`;

		const client = createSuiGroupsClient({
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

		expect(client.groups).toBeDefined();
		expect(client.groups.call).toBeDefined();
		expect(client.groups.tx).toBeDefined();
		expect(client.groups.bcs).toBeDefined();
		expect(client.exampleGroup).toBeDefined();
		expect(client.exampleGroup.createAndShareGroupTx).toBeTypeOf('function');
	});

	it('should have BCS types with correct package-scoped names', () => {
		const suiClientUrl = inject('suiClientUrl');
		const publishedPackages = inject('publishedPackages');
		const packageId = publishedPackages['permissioned-groups'].packageId;
		const exampleGroupPackageId = publishedPackages['example-group'].packageId;
		const witnessType = `${exampleGroupPackageId}::example_group::ExampleGroupWitness`;

		const client = createSuiGroupsClient({
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

		expect(client.groups.bcs.PermissionedGroup.name).toBe(
			`${packageId}::permissioned_group::PermissionedGroup<${witnessType}>`,
		);
		expect(client.groups.bcs.PermissionsAdmin.name).toBe(
			permissionTypes(packageId).PermissionsAdmin,
		);
		expect(client.groups.bcs.MemberAdded.name).toBe(
			`${packageId}::permissioned_group::MemberAdded<${witnessType}>`,
		);
	});
});
