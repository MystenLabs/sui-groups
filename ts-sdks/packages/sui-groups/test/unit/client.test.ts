// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { describe, expect, it } from 'vitest';

import { SuiGroupsClient, suiGroups } from '../../src/client.js';
import { SuiGroupsClientError } from '../../src/error.js';

const VALID_ADDRESS = '0x' + 'ab'.repeat(32);
const VALID_WITNESS_TYPE = `${VALID_ADDRESS}::my_module::MyWitness`;

const MOCK_PACKAGE_ID = '0x' + 'ff'.repeat(32);
const MOCK_PACKAGE_CONFIG = {
	originalPackageId: MOCK_PACKAGE_ID,
	latestPackageId: MOCK_PACKAGE_ID,
};

function createSuiClient(network: string = 'localnet') {
	return new SuiJsonRpcClient({ url: 'http://127.0.0.1:9000', network });
}

describe('SuiGroupsClient', () => {
	describe('constructor validation', () => {
		it('should throw if client is not provided', () => {
			expect(
				() =>
					new SuiGroupsClient({
						client: undefined as any,
						witnessType: VALID_WITNESS_TYPE,
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow(SuiGroupsClientError);
			expect(
				() =>
					new SuiGroupsClient({
						client: undefined as any,
						witnessType: VALID_WITNESS_TYPE,
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow('client must be provided');
		});

		it('should throw if witnessType is not provided', () => {
			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient(),
						witnessType: '' as any,
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow(SuiGroupsClientError);
			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient(),
						witnessType: '' as any,
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow('witnessType must be provided');
		});

		it('should throw if witnessType is missing module/name parts', () => {
			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient(),
						witnessType: `${VALID_ADDRESS}::module`,
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow('Invalid witnessType');

			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient(),
						witnessType: VALID_ADDRESS,
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow('Invalid witnessType');
		});

		it('should throw if witnessType address is invalid', () => {
			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient(),
						witnessType: 'not-an-address::module::Type',
						packageConfig: MOCK_PACKAGE_CONFIG,
					}),
			).toThrow('Invalid witnessType address');
		});

		it('should accept valid witnessType with full address', () => {
			const client = new SuiGroupsClient({
				client: createSuiClient(),
				witnessType: VALID_WITNESS_TYPE,
				packageConfig: MOCK_PACKAGE_CONFIG,
			});
			expect(client).toBeInstanceOf(SuiGroupsClient);
		});

		it('should accept valid witnessType with MVR named package', () => {
			const client = new SuiGroupsClient({
				client: createSuiClient(),
				witnessType: 'app@org/my-package::module::Type',
				packageConfig: MOCK_PACKAGE_CONFIG,
			});
			expect(client).toBeInstanceOf(SuiGroupsClient);
		});

		it('should throw for unsupported network when no packageConfig', () => {
			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient('localnet'),
						witnessType: VALID_WITNESS_TYPE,
					}),
			).toThrow(SuiGroupsClientError);
			expect(
				() =>
					new SuiGroupsClient({
						client: createSuiClient('localnet'),
						witnessType: VALID_WITNESS_TYPE,
					}),
			).toThrow('Unsupported network');
		});
	});

	describe('sub-module initialization', () => {
		it('should expose call, tx, view, bcs after construction', () => {
			const client = new SuiGroupsClient({
				client: createSuiClient(),
				witnessType: VALID_WITNESS_TYPE,
				packageConfig: MOCK_PACKAGE_CONFIG,
			});

			expect(client.call).toBeDefined();
			expect(client.tx).toBeDefined();
			expect(client.view).toBeDefined();
			expect(client.bcs).toBeDefined();
		});

		it('should use provided packageConfig', () => {
			const customOriginalId = '0x' + '11'.repeat(32);
			const customConfig = {
				originalPackageId: customOriginalId,
				latestPackageId: customOriginalId,
			};
			const client = new SuiGroupsClient({
				client: createSuiClient(),
				witnessType: VALID_WITNESS_TYPE,
				packageConfig: customConfig,
			});

			expect(client.bcs.PermissionsAdmin.name).toContain(customConfig.originalPackageId);
		});
	});
});

describe('suiGroups factory + $extend', () => {
	it('should extend SuiClient and expose sub-modules via client.groups', () => {
		const client = createSuiClient().$extend(
			suiGroups({
				witnessType: VALID_WITNESS_TYPE,
				packageConfig: MOCK_PACKAGE_CONFIG,
			}),
		);

		expect(client.groups).toBeDefined();
		expect(client.groups).toBeInstanceOf(SuiGroupsClient);
		expect(client.groups.call).toBeDefined();
		expect(client.groups.tx).toBeDefined();
		expect(client.groups.view).toBeDefined();
		expect(client.groups.bcs).toBeDefined();
	});

	it('should use custom name when provided', () => {
		const client = createSuiClient().$extend(
			suiGroups({
				name: 'permissions',
				witnessType: VALID_WITNESS_TYPE,
				packageConfig: MOCK_PACKAGE_CONFIG,
			}),
		);

		expect(client.permissions).toBeDefined();
		expect(client.permissions).toBeInstanceOf(SuiGroupsClient);
	});

	it('should scope BCS types with provided packageConfig', () => {
		const client = createSuiClient().$extend(
			suiGroups({
				witnessType: VALID_WITNESS_TYPE,
				packageConfig: MOCK_PACKAGE_CONFIG,
			}),
		);

		expect(client.groups.bcs.PermissionsAdmin.name).toContain(
			MOCK_PACKAGE_CONFIG.originalPackageId,
		);
		expect(client.groups.bcs.PermissionedGroup.name).toContain(VALID_WITNESS_TYPE);
	});
});
