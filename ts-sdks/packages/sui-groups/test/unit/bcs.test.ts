// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import { describe, expect, it } from 'vitest';

import { SuiGroupsBCS } from '../../src/bcs.js';

const MOCK_PACKAGE_ID = '0x' + 'ab'.repeat(32);
const MOCK_WITNESS_TYPE = `${MOCK_PACKAGE_ID}::messaging::Messaging`;
const LOCAL_PACKAGE_ALIAS = '@local-pkg/sui-groups';

function createBCS() {
	return new SuiGroupsBCS({
		packageConfig: { originalPackageId: MOCK_PACKAGE_ID, latestPackageId: MOCK_PACKAGE_ID },
		witnessType: MOCK_WITNESS_TYPE,
	});
}

describe('SuiGroupsBCS', () => {
	describe('type name scoping', () => {
		it('should scope PermissionsAdmin type name with package ID', () => {
			const bcsTypes = createBCS();
			expect(bcsTypes.PermissionsAdmin.name).toContain(MOCK_PACKAGE_ID);
			expect(bcsTypes.PermissionsAdmin.name).not.toContain(LOCAL_PACKAGE_ALIAS);
		});

		it('should scope ExtensionPermissionsAdmin type name with package ID', () => {
			const bcsTypes = createBCS();
			expect(bcsTypes.ExtensionPermissionsAdmin.name).toContain(MOCK_PACKAGE_ID);
			expect(bcsTypes.ExtensionPermissionsAdmin.name).not.toContain(LOCAL_PACKAGE_ALIAS);
		});

		it('should scope ObjectAdmin type name with package ID', () => {
			const bcsTypes = createBCS();
			expect(bcsTypes.ObjectAdmin.name).toContain(MOCK_PACKAGE_ID);
			expect(bcsTypes.ObjectAdmin.name).not.toContain(LOCAL_PACKAGE_ALIAS);
		});

		it('should scope PermissionedGroup type name with package ID and witness type', () => {
			const bcsTypes = createBCS();
			expect(bcsTypes.PermissionedGroup.name).toContain(MOCK_PACKAGE_ID);
			expect(bcsTypes.PermissionedGroup.name).toContain(MOCK_WITNESS_TYPE);
			expect(bcsTypes.PermissionedGroup.name).not.toContain(LOCAL_PACKAGE_ALIAS);
		});

		it('should scope GroupDeleter and PausedMarker with package ID', () => {
			const bcsTypes = createBCS();

			expect(bcsTypes.GroupDeleter.name).toContain(MOCK_PACKAGE_ID);
			expect(bcsTypes.GroupDeleter.name).not.toContain(LOCAL_PACKAGE_ALIAS);
			expect(bcsTypes.PausedMarker.name).toContain(MOCK_PACKAGE_ID);
			expect(bcsTypes.PausedMarker.name).not.toContain(LOCAL_PACKAGE_ALIAS);
		});

		it('should scope event types with package ID', () => {
			const bcsTypes = createBCS();

			for (const eventType of [
				bcsTypes.GroupCreated,
				bcsTypes.GroupDeleted,
				bcsTypes.GroupPaused,
				bcsTypes.GroupUnpaused,
				bcsTypes.MemberAdded,
				bcsTypes.MemberRemoved,
				bcsTypes.PermissionsGranted,
				bcsTypes.PermissionsRevoked,
			]) {
				expect(eventType.name).toContain(MOCK_PACKAGE_ID);
				expect(eventType.name).not.toContain(LOCAL_PACKAGE_ALIAS);
			}
		});

		it('should not contain the local package alias in any type name', () => {
			const bcsTypes = createBCS();

			const allTypes = [
				bcsTypes.PermissionsAdmin,
				bcsTypes.ExtensionPermissionsAdmin,
				bcsTypes.ObjectAdmin,
				bcsTypes.GroupDeleter,
				bcsTypes.PausedMarker,
				bcsTypes.PermissionedGroup,
				bcsTypes.GroupCreated,
				bcsTypes.GroupDeleted,
				bcsTypes.GroupPaused,
				bcsTypes.GroupUnpaused,
				bcsTypes.MemberAdded,
				bcsTypes.MemberRemoved,
				bcsTypes.PermissionsGranted,
				bcsTypes.PermissionsRevoked,
			];

			for (const type of allTypes) {
				expect(type.name).not.toContain(LOCAL_PACKAGE_ALIAS);
			}
		});
	});

	describe('GroupDerived generic', () => {
		it('should produce correct type name with custom derivation key type', () => {
			const bcsTypes = createBCS();
			const derived = bcsTypes.GroupDerived(bcs.string());

			expect(derived.name).toContain(MOCK_PACKAGE_ID);
			expect(derived.name).not.toContain(LOCAL_PACKAGE_ALIAS);
		});
	});
});
